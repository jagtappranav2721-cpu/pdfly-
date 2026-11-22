import { useEffect, useRef, useState } from 'react'
import { FileText, Loader2, Upload, X } from 'lucide-react'
import Logo from '../common/Logo'
import { useApp } from '../../stores/appStore'
import { useOpenPdf } from '../../hooks/useOpenPdf'
import { listRecent, loadRecent, removeRecent } from '../../services/storage/recent'
import { formatBytes } from '../../utils/geometry'

type RecentItem = Awaited<ReturnType<typeof listRecent>>[number]

export default function Dashboard() {
  const go = useApp((s) => s.go)
  const { openFile, openBytes, loading, error, clearError } = useOpenPdf()
  const [drag, setDrag] = useState(false)
  const [recent, setRecent] = useState<RecentItem[]>([])
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void listRecent().then(setRecent)
  }, [])

  const openRecent = async (id: string) => {
    const doc = await loadRecent(id)
    if (doc) await openBytes(doc.bytes, doc.name)
  }

  return (
    <div className="min-h-full bg-bg">
      <header className="flex h-14 items-center justify-between border-b border-line bg-surface px-6">
        <Logo onClick={() => go('landing')} />
        <button className="text-sm text-muted hover:text-ink" onClick={() => go('landing')}>
          Back to home
        </button>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-14">
        <h1 className="text-2xl font-semibold tracking-tight">Open a document</h1>
        <p className="mt-1 text-sm text-muted">Your file is opened in this browser tab. Nothing is uploaded.</p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            const f = e.dataTransfer.files[0]
            if (f) void openFile(f)
          }}
          className={`mt-8 flex flex-col items-center rounded-xl border border-dashed bg-surface px-6 py-14 text-center transition-colors ${
            drag ? 'border-accent bg-accent-soft' : 'border-[#d5d8de]'
          }`}
        >
          {loading ? (
            <Loader2 className="animate-spin text-accent" size={22} />
          ) : (
            <Upload className="text-muted" size={22} strokeWidth={1.6} />
          )}
          <p className="mt-4 text-sm font-medium">{loading ? 'Opening document…' : 'Drag a PDF here'}</p>
          <p className="mt-1 text-xs text-muted">or</p>
          <button
            disabled={loading}
            onClick={() => input.current?.click()}
            className="mt-3 h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Upload PDF
          </button>
          <input
            ref={input}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void openFile(f)
              e.target.value = ''
            }}
          />
          <p className="mt-5 text-xs text-muted">
            PDF files only · Password-protected files are not supported yet · Large files may take a moment
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
            <span>{error}</span>
            <button aria-label="Dismiss" onClick={clearError}><X size={14} /></button>
          </div>
        )}

        {recent.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Recent on this device</h2>
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <FileText size={16} className="text-muted" strokeWidth={1.6} />
                  <button className="min-w-0 flex-1 text-left" onClick={() => void openRecent(r.id)}>
                    <div className="truncate text-sm font-medium">{r.name}</div>
                    <div className="text-xs text-muted">
                      {formatBytes(r.size)} · {new Date(r.openedAt).toLocaleDateString()}
                    </div>
                  </button>
                  <button
                    aria-label="Remove from recent"
                    className="text-muted hover:text-ink"
                    onClick={async () => {
                      await removeRecent(r.id)
                      setRecent((x) => x.filter((i) => i.id !== r.id))
                    }}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Copies are stored only in this browser. Remove them any time.</p>
          </section>
        )}
      </main>
    </div>
  )
}
