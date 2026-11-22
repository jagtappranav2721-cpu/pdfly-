import type { DetectedText } from '../../types'
import { matchFont, SUBSET_RE, type RawFontInfo } from '../fonts/fontMatcher'
import { BASELINE } from '../../utils/textMetrics'
import { getSourcePage } from './pdfjs'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

interface RawItem {
  str: string
  transform: number[]
  width: number
  height: number
  fontName: string
}

interface LoadedFont {
  name?: string
  bold?: boolean
  italic?: boolean
  isMonospace?: boolean
  isSerifFont?: boolean
  data?: unknown
}

const cache = new Map<string, Promise<DetectedText[]>>()

function readFont(page: PDFPageProxy, loadedName: string): LoadedFont | null {
  try {
    if (page.commonObjs.has(loadedName)) return page.commonObjs.get(loadedName) as LoadedFont
  } catch {
    /* font object not available */
  }
  return null
}

/**
 * Extracts text runs with position, size and font metadata via PDF.js.
 * Rotated/vertical runs are skipped (they cannot be edited yet).
 */
export function detectText(sourceId: string, doc: PDFDocumentProxy, srcIndex: number): Promise<DetectedText[]> {
  const key = `${sourceId}:${srcIndex}`
  let p = cache.get(key)
  if (!p) {
    p = run(sourceId, doc, srcIndex)
    cache.set(key, p)
  }
  return p
}

async function run(sourceId: string, doc: PDFDocumentProxy, srcIndex: number): Promise<DetectedText[]> {
  const page = await getSourcePage(sourceId, doc, srcIndex)
  const [x0, , , y1] = page.view
  const content = await page.getTextContent()
  // Loads fonts into commonObjs so metadata becomes readable.
  await page.getOperatorList()

  const out: DetectedText[] = []
  const styles = content.styles as Record<string, { fontFamily?: string; vertical?: boolean }>
  content.items.forEach((raw, i) => {
    const it = raw as Partial<RawItem>
    if (typeof it.str !== 'string' || !it.str.trim() || !it.transform || !it.fontName) return
    const [a, b, c, d, e, f] = it.transform
    const angle = Math.atan2(b, a)
    if (Math.abs(angle) > 0.02 || styles[it.fontName]?.vertical) return
    const size = Math.hypot(c, d)
    if (!(size > 0)) return
    const baseline = y1 - f
    const width = it.width ?? 0
    if (!(width > 0)) return

    const f0 = readFont(page, it.fontName)
    const rawName = f0?.name
    const info: RawFontInfo = {
      name: rawName,
      bold: f0?.bold,
      italic: f0?.italic,
      isMonospace: f0?.isMonospace,
      isSerifFont: f0?.isSerifFont,
      cssFamily: styles[it.fontName]?.fontFamily,
    }
    const isSubset = rawName ? SUBSET_RE.test(rawName) : false
    out.push({
      key: String(i),
      text: it.str,
      x: e - x0,
      y: baseline - 0.9 * size,
      w: width,
      h: 1.15 * size,
      baseline,
      size,
      fontName: rawName ?? it.fontName,
      isSubset,
      // Subset fonts are by definition embedded; otherwise PDF.js does not tell us reliably.
      embedded: isSubset ? true : null,
      match: matchFont(info),
    })
  })
  return out
}

/** Top of the text box such that the first baseline lands on `baseline`. */
export function boxTopForBaseline(baseline: number, size: number): number {
  return baseline - BASELINE * size
}

export function clearDetectionCache(sourceId: string) {
  for (const k of [...cache.keys()]) if (k.startsWith(sourceId + ':')) cache.delete(k)
}
