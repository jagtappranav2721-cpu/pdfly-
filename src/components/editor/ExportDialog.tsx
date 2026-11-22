import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Download, Loader2, X } from 'lucide-react'
import { exportPdf } from '../../services/pdf/exporter'
import { useEditor } from '../../stores/editorStore'
import { baseName, formatBytes } from '../../utils/geometry'
import type { PageModel } from '../../types'

interface Props {
  pages: PageModel[]
  suffix: string
  onClose: () => void
}

export default function ExportDialog({ pages, suffix, onClose }: Props) {
  const fileName = useEditor((s) => s.fileName)
  const sources = useEditor((s) => s.sources)
  const [progress, setProgress] = useState({ done: 0, total: pages.length })
  const [result, setResult] = useState<{ url: string; size: number; warnings: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const urlRef = useRef<string | null>(null)
  const outName = `${baseName(fileName)}${suffix}.pdf`

  useEffect(() => {
    let live = true
    exportPdf(pages, sources, (done, total) => live && setProgress({ done, total }))
      .then((r) => {
        if (!live) return
        const url = URL.createObjectURL(new Blob([r.bytes as BlobPart], { type: 'application/pdf' }))
        urlRef.current = url
        setResult({ url, size: r.bytes.byteLength, warnings: r.warnings })
      })
      .catch((e) => live && setError(e instanceof Error ? e.message : 'Export failed.'))
    return () => {
      live = false
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="flex h-[min(86vh,820px)] w-[min(960px,100%)] flex-col overflow-hidden rounded-xl bg-surface shadow-2xl">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
          <div className="text-sm font-medium">Preview · {outName}</div>
          <button aria-label="Close" className="text-muted hover:text-ink" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="relative min-h-0 flex-1 bg-[#eceef2]">
          {error ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="max-w-sm text-center text-sm">
                <AlertTriangle className="mx-auto text-danger" size={22} />
                <p className="mt-3 font-medium">Export failed</p>
                <p className="mt-1 text-muted">{error}</p>
              </div>
            </div>
          ) : result ? (
            <iframe title="Exported PDF preview" src={result.url} className="h-full w-full border-0" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted">
              <Loader2 className="animate-spin text-accent" size={22} />
              Exporting page {Math.min(progress.done + 1, progress.total)} of {progress.total}…
              <div className="h-1 w-48 overflow-hidden rounded bg-line">
                <div className="h-full bg-accent transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-line px-4 py-3">
          <div className="min-w-0 text-xs text-muted">
            {result && <span>{formatBytes(result.size)} · {pages.length} page{pages.length === 1 ? '' : 's'}</span>}
            {result?.warnings.map((w) => (
              <div key={w} className="mt-1 flex items-start gap-1.5 text-[#9a6700]"><AlertTriangle size={12} className="mt-0.5 shrink-0" />{w}</div>
            ))}
          </div>
          <div className="flex shrink-0 gap-2">
            <button className="h-9 rounded-lg border border-line px-4 text-sm hover:bg-black/[0.03]" onClick={onClose}>Back to editing</button>
            <a
              href={result?.url} download={outName}
              aria-disabled={!result}
              className={`flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-white ${result ? 'hover:opacity-90' : 'pointer-events-none opacity-40'}`}
            >
              <Download size={14} /> Download
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
