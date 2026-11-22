import { FileText, ImagePlus, Layers, Lock, Type, Download, ScanText } from 'lucide-react'
import Logo from '../common/Logo'
import EditorPreview from './EditorPreview'
import { useApp } from '../../stores/appStore'
import { BRAND } from '../../config'

const FEATURES = [
  { icon: Type, title: 'Edit existing text', body: 'Click a line of text and change it. Each edit is labelled so you know how it was applied.' },
  { icon: FileText, title: 'Detect fonts', body: 'Font names, sizes and subsets are read from the file and matched to the closest bundled font.' },
  { icon: ImagePlus, title: 'Images', body: 'Insert PNG, JPEG or WebP, then move, resize, rotate and fade them.' },
  { icon: Type, title: 'Format text', body: 'Family, size, bold, italic, underline, colour and alignment.' },
  { icon: Layers, title: 'Manage pages', body: 'Reorder, rotate, duplicate, delete, insert blanks and merge other PDFs.' },
  { icon: Download, title: 'Clean export', body: 'Original pages are copied, not rasterised, so untouched content stays sharp.' },
]

export default function Landing() {
  const go = useApp((s) => s.go)
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="min-h-full bg-bg">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <nav className="hidden items-center gap-7 text-sm text-muted sm:flex">
            <button className="hover:text-ink" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</button>
            <button className="hover:text-ink" onClick={() => scrollTo('features')}>Features</button>
            <button className="hover:text-ink" onClick={() => scrollTo('about')}>About</button>
            <a className="hover:text-ink" href={BRAND.github} target="_blank" rel="noreferrer">GitHub</a>
          </nav>
          <button
            onClick={() => go('dashboard')}
            className="h-8 rounded-lg bg-ink px-3.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Open Editor
          </button>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-10 pt-20 text-center">
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">{BRAND.tagline}</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted">
            Edit text, change fonts, add images, and manage documents with a simple, free, and open-source PDF editor.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => go('dashboard')}
              className="h-10 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Start Editing
            </button>
            <button
              onClick={() => scrollTo('features')}
              className="h-10 rounded-lg border border-line bg-surface px-5 text-sm font-medium transition-colors hover:bg-black/[0.03]"
            >
              Explore Features
            </button>
          </div>
          <div className="mt-14"><EditorPreview /></div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <Icon size={18} className="text-accent" strokeWidth={1.7} />
                <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2">
            <div>
              <Lock size={18} className="text-accent" strokeWidth={1.7} />
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Your documents stay yours.</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                Files are opened and edited locally in your browser. Nothing is sent to a server, there are no accounts, and
                no analytics. Recent files, if you keep them, live in this browser only and can be removed at any time.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-bg p-5 text-sm leading-relaxed text-muted">
              <div className="flex items-center gap-2 font-medium text-ink"><ScanText size={15} /> Honest about limits</div>
              <p className="mt-2">
                PDF stores text as positioned glyphs, not paragraphs. Edits are applied by covering the original run and
                drawing replacement text in the closest bundled font. The editor tells you when the original font could not
                be reused. See the README for details.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-muted">
        <span>© {new Date().getFullYear()} {BRAND.name} · MIT License</span>
        <div className="flex gap-5">
          <a className="hover:text-ink" href={BRAND.github} target="_blank" rel="noreferrer">GitHub</a>
          <a className="hover:text-ink" href={`${BRAND.github}#readme`} target="_blank" rel="noreferrer">Documentation</a>
          <a className="hover:text-ink" href={`${BRAND.github}#privacy`} target="_blank" rel="noreferrer">Privacy</a>
          <a className="hover:text-ink" href={`${BRAND.github}/blob/main/LICENSE`} target="_blank" rel="noreferrer">License</a>
        </div>
      </footer>
    </div>
  )
}
