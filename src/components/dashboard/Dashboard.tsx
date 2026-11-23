import { useEffect, useRef, useState } from 'react'
import {
  Clock,
  FileText,
  History,
  Loader2,
  Lock,
  Moon,
  Sparkles,
  Sun,
  Upload,
  X,
} from 'lucide-react'
import Logo from '../common/Logo'
import { useApp } from '../../stores/appStore'
import { useOpenPdf } from '../../hooks/useOpenPdf'
import { useTheme } from '../../stores/themeStore'
import { listRecent, loadRecent, removeRecent } from '../../services/storage/recent'
import { loadSavedSession, clearSavedSession, type SavedSession } from '../../services/storage/session'
import { formatBytes } from '../../utils/geometry'

type RecentItem = Awaited<ReturnType<typeof listRecent>>[number]

export default function Dashboard() {
  const go = useApp((s) => s.go)
  const { theme, toggleTheme } = useTheme()
  const { openFile, openBytes, resumeSession, loading, error, clearError } = useOpenPdf()
  const [drag, setDrag] = useState(false)
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [activeSession, setActiveSession] = useState<SavedSession | null>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void listRecent().then(setRecent)
    void loadSavedSession().then(setActiveSession)
  }, [])

  const openRecent = async (id: string) => {
    const doc = await loadRecent(id)
    if (doc) await openBytes(doc.bytes, doc.name)
  }

  const handleResume = async () => {
    if (activeSession) {
      await resumeSession(activeSession)
    }
  }

  const handleDiscardSession = async () => {
    await clearSavedSession()
    setActiveSession(null)
  }

  return (
    <div className="min-h-full bg-bg text-ink transition-colors">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-line bg-surface px-6">
        <Logo onClick={() => go('landing')} />
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/5"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </button>
          <button
            className="text-xs font-medium text-muted hover:text-ink transition-colors"
            onClick={() => go('landing')}
          >
            Back to home
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl font-brand">
            Open a document
          </h1>
          <p className="mt-1.5 text-xs text-muted sm:text-sm">
            Everything runs locally inside your browser. No files are uploaded to any server.
          </p>
        </div>

        {/* Previous Saved Session Banner if exists */}
        {activeSession && (
          <div className="mt-6 flex items-center justify-between rounded-xl border border-accent/40 bg-accent-soft p-4 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
                <History size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-semibold text-ink sm:text-sm">
                    {activeSession.name}
                  </span>
                  <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                    Unsaved Edits Recoverable
                  </span>
                </div>
                <p className="text-[11px] text-muted">
                  Last active: {new Date(activeSession.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {activeSession.pages.length} pages
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleResume}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-white shadow-xs hover:bg-accent-hover transition-colors"
              >
                <Sparkles size={13} /> Resume
              </button>
              <button
                onClick={handleDiscardSession}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-ink"
                title="Discard saved session"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Drag & Drop Upload Card */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            const f = e.dataTransfer.files[0]
            if (f) void openFile(f)
          }}
          className={`mt-6 flex flex-col items-center rounded-2xl border-2 border-dashed bg-surface px-6 py-14 text-center shadow-xs transition-all ${
            drag
              ? 'border-accent bg-accent-soft/70 scale-[1.01]'
              : 'border-line hover:border-accent/60'
          }`}
        >
          {loading ? (
            <Loader2 className="animate-spin text-accent" size={32} />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-toolbar text-accent shadow-2xs">
              <Upload size={22} strokeWidth={2} />
            </div>
          )}
          <p className="mt-4 text-base font-semibold text-ink">
            {loading ? 'Analyzing & opening document…' : 'Drag and drop your PDF here'}
          </p>
          <p className="mt-1 text-xs text-muted">Supports all standard PDF documents</p>

          <button
            disabled={loading}
            onClick={() => input.current?.click()}
            className="mt-5 flex h-10 items-center gap-2 rounded-xl bg-accent px-5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-accent-hover disabled:opacity-50"
          >
            <FileText size={15} />
            <span>Browse Files</span>
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

          <div className="mt-6 flex items-center gap-1.5 text-[11px] text-muted">
            <Lock size={12} className="text-success" />
            <span>100% Client-Side · No Account Required · Zero Server Uploads</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-xs text-danger shadow-xs">
            <span>{error}</span>
            <button aria-label="Dismiss error" onClick={clearError}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Recent Documents Section */}
        {recent.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              <Clock size={13} />
              <span>Recent on this device</span>
            </div>
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-2xs">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-toolbar transition-colors">
                  <FileText size={16} className="text-accent shrink-0" strokeWidth={1.8} />
                  <button className="min-w-0 flex-1 text-left" onClick={() => void openRecent(r.id)}>
                    <div className="truncate text-xs font-semibold text-ink sm:text-sm">{r.name}</div>
                    <div className="text-[11px] text-muted">
                      {formatBytes(r.size)} · {new Date(r.openedAt).toLocaleDateString()}
                    </div>
                  </button>
                  <button
                    aria-label="Remove from recent"
                    className="rounded p-1 text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/5"
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
          </section>
        )}
      </main>
    </div>
  )
}
