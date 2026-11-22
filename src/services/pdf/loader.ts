import type { PageModel, Source } from '../../types'
import { uid } from '../../utils/id'
import { loadDocument } from './pdfjs'

/** Opens PDF bytes and builds one editable page model per source page. */
export async function openPdfBytes(bytes: Uint8Array, name: string): Promise<{ source: Source; pages: PageModel[] }> {
  const doc = await loadDocument(bytes)
  const source: Source = { id: uid(), name, bytes, doc }
  const pages: PageModel[] = []
  for (let i = 0; i < doc.numPages; i++) {
    const p = await doc.getPage(i + 1)
    const [x0, y0, x1, y1] = p.view
    pages.push({
      id: uid(),
      sourceId: source.id,
      srcIndex: i,
      box: { x0, y0, w: x1 - x0, h: y1 - y0 },
      rotation: ((p.rotate % 360) + 360) % 360,
      objects: [],
    })
    p.cleanup()
  }
  return { source, pages }
}
