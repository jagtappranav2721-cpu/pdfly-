import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Printer,
  Sparkles,
  X,
} from 'lucide-react'
import { exportPdf } from '../../services/pdf/exporter'
import { exportDocx } from '../../services/docx/exporter'
import { useEditor } from '../../stores/editorStore'
import { baseName, formatBytes } from '../../utils/geometry'
import type { PageModel } from '../../types'

type ExportTab = 'pdf' | 'docx' | 'images' | 'print'

interface Props {
  pages: PageModel[]
  suffix: string
  onClose: () => void
}

export default function ExportDialog({ pages, suffix, onClose }: Props) {
  const fileName = useEditor((s) => s.fileName)
  const sources = useEditor((s) => s.sources)
  const currentPageId = useEditor((s) => s.currentPageId)
  const [tab, setTab] = useState<ExportTab>('pdf')
  const [pageScope, setPageScope] = useState<'all' | 'current'>('all')

  const [progress, setProgress] = useState({ done: 0, total: pages.length })
  const [pdfResult, setPdfResult] = useState<{ url: string; size: number; warnings: string[] } | null>(null)
  const [docxResult, setDocxResult] = useState<{ url: string; size: number; warnings: string[] } | null>(null)
  const [docxLoading, setDocxLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pdfUrlRef = useRef<string | null>(null)
  const docxUrlRef = useRef<string | null>(null)

  const activePages =
    pageScope === 'current'
      ? pages.filter((p) => p.id === currentPageId) || [pages[0]]
      : pages

  const outBase = baseName(fileName) || 'document'
  const outPdfName = `${outBase}${suffix}.pdf`
  const outDocxName = `${outBase}${suffix}.docx`

  // Generate PDF preview on mount or when pageScope changes
  useEffect(() => {
    let live = true
    setPdfResult(null)
    setError(null)
    setProgress({ done: 0, total: activePages.length })

    exportPdf(activePages, sources, (done, total) => live && setProgress({ done, total }))
      .then((r) => {
        if (!live) return
        const url = URL.createObjectURL(new Blob([r.bytes as BlobPart], { type: 'application/pdf' }))
        if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current)
        pdfUrlRef.current = url
        setPdfResult({ url, size: r.bytes.byteLength, warnings: r.warnings })
      })
      .catch((e) => live && setError(e instanceof Error ? e.message : 'PDF export failed.'))

    return () => {
      live = false
    }
  }, [activePages, sources])

  // Generate Word DOCX on demand
  const handleGenerateDocx = async () => {
    if (docxResult) return
    setDocxLoading(true)
    setError(null)
    try {
      const res = await exportDocx(activePages, sources)
      const url = URL.createObjectURL(res.blob)
      if (docxUrlRef.current) URL.revokeObjectURL(docxUrlRef.current)
      docxUrlRef.current = url
      setDocxResult({ url, size: res.blob.size, warnings: res.warnings })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Word conversion failed.')
    } finally {
      setDocxLoading(false)
    }
  }

  // Revoke URLs on unmount
  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current)
      if (docxUrlRef.current) URL.revokeObjectURL(docxUrlRef.current)
    }
  }, [])

  // Handle direct print
  const handlePrint = () => {
    if (!pdfResult?.url) return
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.src = pdfResult.url
    document.body.appendChild(iframe)
    iframe.onload = () => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 3000)
    }
  }

  // Count embedded images across pages
  const extractedImages: { id: string; url: string; mime: string; pageNum: number }[] = []
  pages.forEach((p, pIdx) => {
    p.objects.forEach((o) => {
      if (o.type === 'image' && o.url) {
        extractedImages.push({ id: o.id, url: o.url, mime: o.mime, pageNum: pIdx + 1 })
      }
    })
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex h-[min(88vh,860px)] w-[min(1040px,100%)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
              <FileDown size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-ink">Export & Share Document</h2>
              <p className="text-xs text-muted">{fileName}</p>
            </div>
          </div>
          <button
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/5"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab Selector & Scope Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-line bg-toolbar px-5 py-2.5">
          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface p-1">
            <button
              onClick={() => setTab('pdf')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === 'pdf' ? 'bg-accent text-white shadow-xs' : 'text-muted hover:text-ink'
              }`}
            >
              <FileText size={14} /> PDF Document
            </button>
            <button
              onClick={() => {
                setTab('docx')
                void handleGenerateDocx()
              }}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === 'docx' ? 'bg-accent text-white shadow-xs' : 'text-muted hover:text-ink'
              }`}
            >
              <FileSpreadsheet size={14} /> Word (.docx)
            </button>
            <button
              onClick={() => setTab('images')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === 'images' ? 'bg-accent text-white shadow-xs' : 'text-muted hover:text-ink'
              }`}
            >
              <ImageIcon size={14} /> Images ({extractedImages.length})
            </button>
            <button
              onClick={() => setTab('print')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === 'print' ? 'bg-accent text-white shadow-xs' : 'text-muted hover:text-ink'
              }`}
            >
              <Printer size={14} /> Print
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted">Pages:</span>
            <div className="flex rounded-md border border-line bg-surface p-0.5">
              <button
                onClick={() => setPageScope('all')}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  pageScope === 'all' ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink'
                }`}
              >
                All ({pages.length})
              </button>
              <button
                onClick={() => setPageScope('current')}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  pageScope === 'current' ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink'
                }`}
              >
                Current Page
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="relative min-h-0 flex-1 bg-bg">
          {error ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="max-w-md rounded-xl border border-danger/30 bg-surface p-6 text-center text-sm shadow-sm">
                <AlertTriangle className="mx-auto text-danger" size={26} />
                <p className="mt-3 text-base font-semibold text-ink">Export Encountered an Issue</p>
                <p className="mt-1 text-xs text-muted leading-relaxed">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-4 rounded-lg bg-surface border border-line px-4 py-1.5 text-xs font-medium text-ink hover:bg-black/5"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : tab === 'pdf' ? (
            pdfResult ? (
              <iframe title="Exported PDF preview" src={pdfResult.url} className="h-full w-full border-0" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted">
                <Loader2 className="animate-spin text-accent" size={26} />
                <p className="font-medium text-ink">Generating high-fidelity PDF…</p>
                <p className="text-xs text-muted">
                  Processing page {Math.min(progress.done + 1, progress.total)} of {progress.total}
                </p>
                <div className="h-1.5 w-56 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full bg-accent transition-all duration-200"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )
          ) : tab === 'docx' ? (
            <div className="flex h-full items-center justify-center p-8">
              {docxLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="animate-spin text-accent" size={28} />
                  <p className="text-sm font-semibold text-ink">Reconstructing Word (.docx) Structure…</p>
                  <p className="max-w-xs text-xs text-muted">
                    Analyzing reading order, paragraphs, headings, typography and images for editable Word output.
                  </p>
                </div>
              ) : docxResult ? (
                <div className="max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-md">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                    <FileSpreadsheet size={28} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{outDocxName}</h3>
                  <p className="mt-1 text-xs text-muted">
                    Genuine editable Microsoft Word document · {formatBytes(docxResult.size)} · {activePages.length} page(s)
                  </p>

                  <div className="mt-5 rounded-xl border border-line/60 bg-toolbar p-4 text-left text-xs leading-relaxed text-muted">
                    <div className="flex items-center gap-1.5 font-medium text-ink">
                      <Sparkles size={14} className="text-accent" /> Editable Document Features
                    </div>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li>Paragraphs and headings grouped automatically</li>
                      <li>Fonts, sizes, colors and styles mapped</li>
                      <li>Compatible with Microsoft Word, LibreOffice, Google Docs</li>
                    </ul>
                  </div>

                  <a
                    href={docxResult.url}
                    download={outDocxName}
                    className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                  >
                    <Download size={15} /> Download Word Document (.docx)
                  </a>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={handleGenerateDocx}
                    className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90"
                  >
                    Generate Word (.docx) Document
                  </button>
                </div>
              )}
            </div>
          ) : tab === 'images' ? (
            <div className="thin-scroll h-full overflow-y-auto p-6">
              {extractedImages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted">
                  <ImageIcon size={32} className="opacity-40" />
                  <p className="mt-3 text-sm font-medium text-ink">No added images found</p>
                  <p className="mt-1 max-w-xs text-xs">
                    Images inserted during your editing session appear here for standalone extraction.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {extractedImages.map((img, i) => (
                    <div key={img.id} className="overflow-hidden rounded-xl border border-line bg-surface p-3 shadow-xs">
                      <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg bg-toolbar">
                        <img src={img.url} alt="" className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-ink">Image {i + 1}</span>
                        <span className="text-muted">Page {img.pageNum}</span>
                      </div>
                      <a
                        href={img.url}
                        download={`image-${i + 1}.${img.mime.split('/')[1] || 'png'}`}
                        className="mt-2 flex h-7 items-center justify-center gap-1 rounded-md bg-accent-soft text-xs font-medium text-accent hover:bg-accent hover:text-white transition-colors"
                      >
                        <Download size={12} /> Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div className="max-w-sm rounded-2xl border border-line bg-surface p-8 shadow-md">
                <Printer size={36} className="mx-auto text-accent" />
                <h3 className="mt-3 text-base font-semibold text-ink">Print Document Directly</h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Sends the high-resolution vector output directly to your system print dialog with full page formatting.
                </p>
                <button
                  disabled={!pdfResult}
                  onClick={handlePrint}
                  className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  <Printer size={15} /> Open Print Dialog
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-line bg-surface px-5 py-3">
          <div className="min-w-0 text-xs text-muted">
            {tab === 'pdf' && pdfResult && (
              <span className="font-medium text-ink">
                {formatBytes(pdfResult.size)} · {activePages.length} page{activePages.length === 1 ? '' : 's'}
              </span>
            )}
            {tab === 'docx' && docxResult && (
              <span className="font-medium text-ink">
                Word document · {formatBytes(docxResult.size)}
              </span>
            )}
            {pdfResult?.warnings && pdfResult.warnings.length > 0 && (
              <div className="mt-0.5 flex items-center gap-1 text-[#b45309] dark:text-[#f59e0b]">
                <AlertTriangle size={12} />
                <span>Notice: Some characters were adapted for PDF standard font compatibility.</span>
              </div>
            )}
          </div>

          <div className="flex shrink-0 gap-2.5">
            <button
              className="h-9 rounded-lg border border-line bg-surface px-4 text-xs font-medium text-ink hover:bg-toolbar transition-colors"
              onClick={onClose}
            >
              Back to editing
            </button>
            {tab === 'pdf' && (
              <a
                href={pdfResult?.url}
                download={outPdfName}
                aria-disabled={!pdfResult}
                className={`flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-medium text-white shadow-sm transition-opacity ${
                  pdfResult ? 'hover:bg-accent-hover' : 'pointer-events-none opacity-40'
                }`}
              >
                <Download size={14} /> Download PDF
              </a>
            )}
            {tab === 'docx' && docxResult && (
              <a
                href={docxResult.url}
                download={outDocxName}
                className="flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-medium text-white shadow-sm hover:bg-accent-hover transition-opacity"
              >
                <Download size={14} /> Download Word (.docx)
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
