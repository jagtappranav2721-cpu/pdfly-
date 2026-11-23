import { useState, useEffect } from 'react'
import { FileText, Info, RotateCcw, RotateCw } from 'lucide-react'
import IconButton from '../../common/IconButton'
import { BASE_SCALE, useEditor } from '../../../stores/editorStore'
import { formatBytes, round1 } from '../../../utils/geometry'

function detectPageCategory(w: number, h: number): string {
  const minDim = Math.min(w, h)
  const maxDim = Math.max(w, h)

  if (Math.abs(minDim - 595) < 6 && Math.abs(maxDim - 842) < 6) return 'A4'
  if (Math.abs(minDim - 612) < 6 && Math.abs(maxDim - 792) < 6) return 'US Letter'
  if (Math.abs(minDim - 612) < 6 && Math.abs(maxDim - 1008) < 6) return 'US Legal'
  if (Math.abs(minDim - 842) < 8 && Math.abs(maxDim - 1191) < 8) return 'A3'
  if (Math.abs(minDim - 420) < 6 && Math.abs(maxDim - 595) < 6) return 'A5'
  if (Math.abs(minDim - 792) < 6 && Math.abs(maxDim - 1224) < 6) return 'Tabloid / Ledger'

  return 'Custom Size'
}

export default function PageInfoSection() {
  const pages = useEditor((s) => s.pages)
  const currentId = useEditor((s) => s.currentPageId)
  const sources = useEditor((s) => s.sources)
  const fileName = useEditor((s) => s.fileName)
  const scale = useEditor((s) => s.scale)

  const [metadata, setMetadata] = useState<{
    title?: string
    author?: string
    creationDate?: string
    modDate?: string
    pdfVersion?: string
  }>({})

  const page = pages.find((p) => p.id === currentId) ?? pages[0]

  useEffect(() => {
    if (!page?.sourceId || !sources[page.sourceId]) return
    const src = sources[page.sourceId]
    src.doc.getMetadata().then((data) => {
      const info = (data.info as Record<string, unknown>) || {}
      setMetadata({
        title: typeof info.Title === 'string' && info.Title.trim() ? info.Title : undefined,
        author: typeof info.Author === 'string' && info.Author.trim() ? info.Author : undefined,
        creationDate: typeof info.CreationDate === 'string' ? info.CreationDate : undefined,
        modDate: typeof info.ModDate === 'string' ? info.ModDate : undefined,
        pdfVersion: typeof info.PDFFormatVersion === 'string' ? info.PDFFormatVersion : '1.7',
      })
    }).catch(() => {})
  }, [page?.sourceId, sources])

  if (!page) return null

  const isRotated = page.rotation % 180 !== 0
  const widthPt = isRotated ? page.box.h : page.box.w
  const heightPt = isRotated ? page.box.w : page.box.h
  const widthMm = (widthPt / 72) * 25.4
  const heightMm = (heightPt / 72) * 25.4
  const orientation = widthPt > heightPt ? 'Landscape' : 'Portrait'
  const category = detectPageCategory(widthPt, heightPt)
  const zoomPct = Math.round((scale / BASE_SCALE) * 100)

  const primarySource = Object.values(sources)[0]
  const fileSize = primarySource?.bytes?.byteLength

  return (
    <div className="space-y-4">
      {/* Current Page Info Card */}
      <div className="rounded-xl border border-line bg-surface p-3.5 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-ink">
            Page {pages.indexOf(page) + 1} of {pages.length}
          </span>
          <span className="rounded bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">
            {category}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-toolbar p-2">
            <span className="text-[10px] text-muted">Dimensions</span>
            <div className="mt-0.5 font-medium text-ink tabular-nums">
              {round1(widthPt)} × {round1(heightPt)} pt
            </div>
            <div className="text-[10px] text-muted tabular-nums">
              {round1(widthMm)} × {round1(heightMm)} mm
            </div>
          </div>

          <div className="rounded-lg bg-toolbar p-2">
            <span className="text-[10px] text-muted">Orientation</span>
            <div className="mt-0.5 font-medium text-ink">{orientation}</div>
            <div className="text-[10px] text-muted">Zoom: {zoomPct}%</div>
          </div>
        </div>

        {/* Rotation Controls */}
        <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2.5">
          <span className="text-xs text-muted">Rotation ({page.rotation}°)</span>
          <div className="flex items-center gap-1">
            <IconButton tip="Rotate -90°" onClick={() => useEditor.getState().rotatePage(page.id, -90)}>
              <RotateCcw size={14} />
            </IconButton>
            <IconButton tip="Rotate +90°" onClick={() => useEditor.getState().rotatePage(page.id, 90)}>
              <RotateCw size={14} />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Document Properties Card */}
      <div className="rounded-xl border border-line bg-surface p-3.5 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
          <FileText size={14} className="text-accent" /> Document Properties
        </div>

        <div className="mt-2.5 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted">Filename</span>
            <span className="max-w-[140px] truncate font-medium text-ink" title={fileName}>
              {fileName}
            </span>
          </div>

          {fileSize && (
            <div className="flex justify-between">
              <span className="text-muted">File Size</span>
              <span className="font-medium text-ink">{formatBytes(fileSize)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted">Total Pages</span>
            <span className="font-medium text-ink">{pages.length}</span>
          </div>

          {metadata.pdfVersion && (
            <div className="flex justify-between">
              <span className="text-muted">PDF Version</span>
              <span className="font-medium text-ink">{metadata.pdfVersion}</span>
            </div>
          )}

          {metadata.title && (
            <div className="flex justify-between">
              <span className="text-muted">Title</span>
              <span className="max-w-[140px] truncate text-ink">{metadata.title}</span>
            </div>
          )}

          {metadata.author && (
            <div className="flex justify-between">
              <span className="text-muted">Author</span>
              <span className="max-w-[140px] truncate text-ink">{metadata.author}</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-line/60 bg-toolbar p-3 text-xs leading-relaxed text-muted">
        <div className="flex items-center gap-1 font-medium text-ink">
          <Info size={13} className="text-accent" /> Tip
        </div>
        <p className="mt-1">
          Click any text run on the document with the <b className="text-ink">Edit Text</b> tool to customize font, size, and styling.
        </p>
      </div>
    </div>
  )
}
