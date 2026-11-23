import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  ImageRun,
  AlignmentType,
  PageBreak,
  Packer,
} from 'docx'
import type { PageModel, Source, TextObj } from '../../types'

export interface DocxExportResult {
  blob: Blob
  warnings: string[]
}

interface TextChunk {
  text: string
  x: number
  y: number // top-origin in pt
  size: number
  bold: boolean
  italic: boolean
  underline: boolean
  color: string // hex
  align: 'left' | 'center' | 'right'
}

function cleanHex(hex: string): string {
  const h = hex.replace('#', '').trim()
  if (h.length === 3) return h.split('').map((c) => c + c).join('')
  if (h.length === 6) return h
  return '000000'
}

/**
 * Genuine Microsoft Word (.docx) generator:
 * Reconstructs document structure, reading order, headings, paragraphs,
 * styling (bold/italic/underline/color/size), images, and page breaks.
 */
export async function exportDocx(
  pages: PageModel[],
  sources: Record<string, Source>,
  onProgress?: (done: number, total: number) => void,
): Promise<DocxExportResult> {
  const warnings: string[] = []
  const docChildren: Paragraph[] = []

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx]
    const chunks: TextChunk[] = []

    // 1. Gather original PDF text items (excluding those covered by edited text)
    if (page.sourceId && sources[page.sourceId]) {
      const src = sources[page.sourceId]
      try {
        const pageProxy = await src.doc.getPage(page.srcIndex + 1)
        const content = await pageProxy.getTextContent()

        // Gather cover boxes to omit original text that was edited/replaced
        const covers = page.objects
          .filter((o): o is TextObj => o.type === 'text' && !!o.cover)
          .map((o) => o.cover!)

        for (const item of content.items) {
          if (!('str' in item) || !item.str.trim()) continue
          const tx = item.transform
          const x = tx[4]
          const yFromBottom = tx[5]
          const y = page.box.h - yFromBottom
          const size = Math.hypot(tx[0], tx[1]) || 12

          // Check if covered
          const isCovered = covers.some(
            (c) => x >= c.x - 2 && x <= c.x + c.w + 2 && y >= c.y - 2 && y <= c.y + c.h + 2,
          )
          if (isCovered) continue

          const fontName = ((item as { fontName?: string }).fontName ?? '').toLowerCase()
          const isBold = /bold|black|heavy|semibold/i.test(fontName)
          const isItalic = /italic|oblique/i.test(fontName)

          chunks.push({
            text: item.str,
            x,
            y,
            size,
            bold: isBold,
            italic: isItalic,
            underline: false,
            color: '000000',
            align: 'left',
          })
        }
      } catch {
        warnings.push(`Page ${pIdx + 1}: Text extraction was partially limited.`)
      }
    }

    // 2. Gather user-added / edited text objects
    for (const obj of page.objects) {
      if (obj.type === 'text' && obj.text.trim()) {
        const lines = obj.text.split('\n')
        lines.forEach((line, lineIdx) => {
          if (!line.trim()) return
          chunks.push({
            text: line,
            x: obj.x,
            y: obj.y + lineIdx * (obj.style.size * 1.2),
            size: obj.style.size,
            bold: obj.style.bold,
            italic: obj.style.italic,
            underline: obj.style.underline,
            color: cleanHex(obj.style.color),
            align: obj.style.align,
          })
        })
      }
    }

    // 3. Sort chunks naturally: Top-to-bottom, then left-to-right
    chunks.sort((a, b) => {
      const lineTolerance = 4
      if (Math.abs(a.y - b.y) > lineTolerance) {
        return a.y - b.y
      }
      return a.x - b.x
    })

    // 4. Group into paragraphs based on vertical line gaps
    const paragraphs: TextChunk[][] = []
    let currentPara: TextChunk[] = []

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i]
      if (currentPara.length === 0) {
        currentPara.push(c)
      } else {
        const prev = currentPara[currentPara.length - 1]
        const yDiff = c.y - prev.y
        const maxLineGap = (prev.size || 12) * 1.8

        if (yDiff <= maxLineGap) {
          currentPara.push(c)
        } else {
          paragraphs.push(currentPara)
          currentPara = [c]
        }
      }
    }
    if (currentPara.length > 0) paragraphs.push(currentPara)

    // 5. Convert paragraphs into docx Paragraphs with runs and headings
    for (const p of paragraphs) {
      if (p.length === 0) continue
      const avgSize = p.reduce((sum, c) => sum + c.size, 0) / p.length
      const primaryAlign = p[0].align

      let heading: typeof HeadingLevel[keyof typeof HeadingLevel] | undefined = undefined
      if (avgSize >= 22) heading = HeadingLevel.HEADING_1
      else if (avgSize >= 16) heading = HeadingLevel.HEADING_2
      else if (avgSize >= 14 && p.some((c) => c.bold)) heading = HeadingLevel.HEADING_3

      const runs: TextRun[] = []
      for (let ci = 0; ci < p.length; ci++) {
        const c = p[ci]
        const spacer = ci > 0 && !c.text.startsWith(' ') && !p[ci - 1].text.endsWith(' ') ? ' ' : ''
        runs.push(
          new TextRun({
            text: spacer + c.text,
            bold: c.bold,
            italics: c.italic,
            underline: c.underline ? {} : undefined,
            color: c.color,
            size: Math.round(c.size * 2), // docx uses half-points
            font: 'Montserrat',
          }),
        )
      }

      docChildren.push(
        new Paragraph({
          heading,
          children: runs,
          alignment:
            primaryAlign === 'center'
              ? AlignmentType.CENTER
              : primaryAlign === 'right'
              ? AlignmentType.RIGHT
              : AlignmentType.LEFT,
          spacing: { after: 120, line: 260 },
        }),
      )
    }

    // 6. Embed images
    for (const obj of page.objects) {
      if (obj.type === 'image' && obj.data) {
        try {
          docChildren.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: obj.data,
                  type: obj.mime === 'image/jpeg' ? 'jpg' : 'png',
                  transformation: {
                    width: Math.min(540, Math.round(obj.w * 0.75)),
                    height: Math.min(700, Math.round(obj.h * 0.75)),
                  },
                }),
              ],
              spacing: { after: 140 },
            }),
          )
        } catch {
          warnings.push(`Image on page ${pIdx + 1} could not be embedded into Word document.`)
        }
      }
    }

    // 7. Page break between pages
    if (pIdx < pages.length - 1) {
      docChildren.push(
        new Paragraph({
          children: [new PageBreak()],
        }),
      )
    }

    onProgress?.(pIdx + 1, pages.length)
  }

  // Create Word document with proper default formatting
  const doc = new Document({
    creator: 'PDFly Studio',
    title: 'Exported from PDFly Studio',
    description: 'Generated with PDFly Studio — Edit. Refine. Export. All in One Place.',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5 inch margins
          },
        },
        children: docChildren.length > 0 ? docChildren : [new Paragraph({ text: 'Empty Document' })],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  return { blob, warnings }
}
