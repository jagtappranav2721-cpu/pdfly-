import {
  PDFDocument, PDFFont, PDFPage, LineCapStyle, BlendMode, degrees, rgb,
} from 'pdf-lib'
import type { ImageObj, PageModel, ShapeObj, Source, TextObj, PathObj } from '../../types'
import { stdFontName } from '../fonts/fontMatcher'
import { BASELINE, LINE_HEIGHT } from '../../utils/textMetrics'

export interface ExportResult {
  bytes: Uint8Array
  warnings: string[]
}

function color(hex: string) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

/**
 * Builds the output PDF. Original pages are copied (not re-rendered), so
 * untouched text, vectors and images are preserved byte-for-byte in their
 * content streams. Edits are drawn on top as additional content.
 */
export async function exportPdf(
  pages: PageModel[],
  sources: Record<string, Source>,
  onProgress?: (done: number, total: number) => void,
): Promise<ExportResult> {
  const out = await PDFDocument.create()
  const warnings: string[] = []
  const loaded = new Map<string, PDFDocument>()
  const fonts = new Map<string, PDFFont>()
  const images = new Map<string, Awaited<ReturnType<PDFDocument['embedPng']>>>()

  const getFont = async (t: TextObj) => {
    const name = stdFontName(t.style.family, t.style.bold, t.style.italic)
    let f = fonts.get(name)
    if (!f) {
      f = await out.embedFont(name)
      fonts.set(name, f)
    }
    return f
  }

  for (let n = 0; n < pages.length; n++) {
    const pm = pages[n]
    let page: PDFPage
    if (pm.sourceId) {
      const src = sources[pm.sourceId]
      if (!src) throw new Error('A source document is missing.')
      let doc = loaded.get(src.id)
      if (!doc) {
        try {
          doc = await PDFDocument.load(src.bytes)
        } catch {
          throw new Error(`"${src.name}" could not be processed for export (it may be encrypted or damaged).`)
        }
        loaded.set(src.id, doc)
      }
      ;[page] = await out.copyPages(doc, [pm.srcIndex])
      out.addPage(page)
    } else {
      page = out.addPage([pm.box.w, pm.box.h])
    }
    page.setRotation(degrees(((pm.rotation % 360) + 360) % 360))

    const toPdf = (x: number, y: number) => ({ x: pm.box.x0 + x, y: pm.box.y0 + pm.box.h - y })

    /** Maps a point given relative to a box's bottom-left corner into PDF space, honouring rotation about the box centre. */
    const place = (bx: number, by: number, w: number, h: number, rotCw: number, lx: number, ly: number) => {
      const c = toPdf(bx + w / 2, by + h / 2)
      const phi = (-rotCw * Math.PI) / 180
      const dx = lx - w / 2
      const dy = ly - h / 2
      return {
        x: c.x + dx * Math.cos(phi) - dy * Math.sin(phi),
        y: c.y + dx * Math.sin(phi) + dy * Math.cos(phi),
      }
    }

    // Pass 1: cover rectangles for overlay-based text replacement.
    for (const o of pm.objects) {
      if (o.type === 'text' && o.cover) {
        const p = toPdf(o.cover.x, o.cover.y + o.cover.h)
        page.drawRectangle({ x: p.x, y: p.y, width: o.cover.w, height: o.cover.h, color: color(o.cover.color), borderWidth: 0 })
      }
    }

    // Pass 2: the objects themselves.
    for (const o of pm.objects) {
      if (o.type === 'text') {
        await drawText(o)
      } else if (o.type === 'image') {
        await drawImage(o)
      } else if (o.type === 'shape') {
        drawShape(o)
      } else {
        drawPath(o)
      }
    }

    async function drawText(t: TextObj) {
      if (!t.text) return
      const font = await getFont(t)
      const size = t.style.size
      const safe = (s: string) => {
        let res = ''
        for (const ch of s) {
          try { font.encodeText(ch); res += ch } catch { res += '?'; if (!warnings.includes(WARN_ENC)) warnings.push(WARN_ENC) }
        }
        return res
      }
      const lines = t.text.split('\n').map(safe)
      const widths = lines.map((l) => font.widthOfTextAtSize(l, size))
      const w = Math.max(...widths, 1)
      const h = lines.length * LINE_HEIGHT * size

      // Text background highlight if configured
      if (t.style.backgroundColor) {
        const p = place(t.x, t.y, w, h, t.rotation, 0, 0)
        page.drawRectangle({
          x: p.x,
          y: p.y,
          width: w,
          height: h,
          rotate: degrees(-t.rotation),
          color: color(t.style.backgroundColor),
          borderWidth: 0,
          opacity: 0.85,
        })
      }

      lines.forEach((line, i) => {
        if (!line) return
        const lx = t.style.align === 'left' ? 0 : t.style.align === 'center' ? (w - widths[i]) / 2 : w - widths[i]
        const ly = h - BASELINE * size - i * LINE_HEIGHT * size
        const p = place(t.x, t.y, w, h, t.rotation, lx, ly)
        page.drawText(line, {
          x: p.x, y: p.y, size, font, color: color(t.style.color),
          opacity: t.opacity, rotate: degrees(-t.rotation),
        })

        // Underline
        if (t.style.underline) {
          const a = place(t.x, t.y, w, h, t.rotation, lx, ly - size * 0.12)
          const b = place(t.x, t.y, w, h, t.rotation, lx + widths[i], ly - size * 0.12)
          page.drawLine({ start: a, end: b, thickness: Math.max(0.6, size * 0.07), color: color(t.style.color), opacity: t.opacity })
        }

        // Strikethrough
        if (t.style.strikethrough) {
          const a = place(t.x, t.y, w, h, t.rotation, lx, ly + size * 0.28)
          const b = place(t.x, t.y, w, h, t.rotation, lx + widths[i], ly + size * 0.28)
          page.drawLine({ start: a, end: b, thickness: Math.max(0.6, size * 0.07), color: color(t.style.color), opacity: t.opacity })
        }
      })
    }

    async function drawImage(im: ImageObj) {
      let emb = images.get(im.id)
      if (!emb) {
        emb = im.mime === 'image/png' ? await out.embedPng(im.data) : await out.embedJpg(im.data)
        images.set(im.id, emb)
      }
      const p = place(im.x, im.y, im.w, im.h, im.rotation, 0, 0)
      page.drawImage(emb, { x: p.x, y: p.y, width: im.w, height: im.h, rotate: degrees(-im.rotation), opacity: im.opacity })
    }

    function drawShape(s: ShapeObj) {
      const isHL = s.shape === 'highlight'

      if (s.shape === 'ellipse') {
        const c = toPdf(s.x + s.w / 2, s.y + s.h / 2)
        page.drawEllipse({
          x: c.x, y: c.y, xScale: s.w / 2, yScale: s.h / 2,
          color: s.fill ? color(s.fill) : undefined,
          borderColor: s.stroke ? color(s.stroke) : undefined,
          borderWidth: s.stroke ? s.strokeWidth : 0,
          opacity: s.opacity, borderOpacity: s.opacity, rotate: degrees(-s.rotation),
        })
        return
      }

      if (s.shape === 'line' || s.shape === 'underline' || s.shape === 'strikethrough') {
        const x1 = s.x1 ?? 0
        const y1 = s.y1 ?? (s.shape === 'underline' || s.shape === 'strikethrough' ? s.h / 2 : 0)
        const x2 = s.x2 ?? s.w
        const y2 = s.y2 ?? (s.shape === 'underline' || s.shape === 'strikethrough' ? s.h / 2 : s.h)
        const a = place(s.x, s.y, s.w, s.h, s.rotation, x1, y1)
        const b = place(s.x, s.y, s.w, s.h, s.rotation, x2, y2)
        page.drawLine({
          start: a,
          end: b,
          thickness: s.strokeWidth || 2,
          color: color(s.shape === 'strikethrough' ? (s.stroke ?? '#DC2626') : (s.stroke ?? '#2563EB')),
          opacity: s.opacity,
        })
        return
      }

      if (s.shape === 'arrow') {
        const x1 = s.x1 ?? 0
        const y1 = s.y1 ?? 0
        const x2 = s.x2 ?? s.w
        const y2 = s.y2 ?? s.h
        const a = place(s.x, s.y, s.w, s.h, s.rotation, x1, y1)
        const b = place(s.x, s.y, s.w, s.h, s.rotation, x2, y2)
        const strokeColor = color(s.stroke ?? '#2563EB')
        page.drawLine({ start: a, end: b, thickness: s.strokeWidth || 2, color: strokeColor, opacity: s.opacity })

        // Arrow head
        const angle = Math.atan2(b.y - a.y, b.x - a.x)
        const headLen = Math.min(12, Math.max(6, (s.strokeWidth || 2) * 3))
        const arrow1 = {
          x: b.x - headLen * Math.cos(angle - Math.PI / 6),
          y: b.y - headLen * Math.sin(angle - Math.PI / 6),
        }
        const arrow2 = {
          x: b.x - headLen * Math.cos(angle + Math.PI / 6),
          y: b.y - headLen * Math.sin(angle + Math.PI / 6),
        }
        page.drawLine({ start: b, end: arrow1, thickness: s.strokeWidth || 2, color: strokeColor, opacity: s.opacity })
        page.drawLine({ start: b, end: arrow2, thickness: s.strokeWidth || 2, color: strokeColor, opacity: s.opacity })
        return
      }

      const p = place(s.x, s.y, s.w, s.h, s.rotation, 0, 0)
      page.drawRectangle({
        x: p.x, y: p.y, width: s.w, height: s.h, rotate: degrees(-s.rotation),
        color: s.fill ? color(s.fill) : undefined,
        borderColor: s.stroke ? color(s.stroke) : undefined,
        borderWidth: s.stroke ? s.strokeWidth : 0,
        opacity: s.opacity, borderOpacity: s.opacity,
        blendMode: isHL ? BlendMode.Multiply : undefined,
      })
    }

    function drawPath(pa: PathObj) {
      if (pa.points.length < 2) return
      const d = pa.points.map((pt, i) => `${i ? 'L' : 'M'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`).join(' ')
      page.drawSvgPath(d, {
        x: pm.box.x0, y: pm.box.y0 + pm.box.h,
        borderColor: color(pa.color), borderWidth: pa.width,
        borderOpacity: pa.opacity, borderLineCap: LineCapStyle.Round,
      })
    }

    onProgress?.(n + 1, pages.length)
    // Yield so the progress UI can paint between pages.
    await new Promise((r) => setTimeout(r))
  }

  const bytes = await out.save()
  return { bytes, warnings }
}

const WARN_ENC =
  'Some characters are outside the Latin character set supported by standard PDF fonts and were substituted.'
