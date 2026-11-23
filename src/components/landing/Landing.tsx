import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  ImagePlus,
  Layers,
  Lock,
  Moon,
  Pencil,
  ShieldCheck,
  Sparkles,
  Sun,
  Type,
  Zap,
} from 'lucide-react'
import Logo from '../common/Logo'
import EditorPreview from './EditorPreview'
import { useApp } from '../../stores/appStore'
import { useTheme } from '../../stores/themeStore'
import { BRAND } from '../../config'

const KEY_HIGHLIGHTS = [
  'No Account or Sign-Up Needed',
  '100% In-Browser & Private',
  '50+ Curated Fonts Library',
  'Genuine Word (.docx) Export',
]

const FEATURES = [
  {
    icon: Type,
    title: '50+ Professional Fonts',
    body: 'Searchable library spanning Sans, Serif, Monospace, and Display with real-time browser preview and reliable PDF rendering.',
  },
  {
    icon: Sparkles,
    title: 'Intelligent Font Detection',
    body: 'Inspects PDF text layers, identifies embedded families and weights, and suggests the closest matching fonts.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Genuine Word (.docx) Export',
    body: 'Converts your PDF into an editable Microsoft Word document with reconstructed paragraphs, headings, and formatting.',
  },
  {
    icon: Pencil,
    title: 'Text & Vector Editing',
    body: 'Click any existing line to modify text with instant overlay replacement. Add highlights, freehand ink, and vector shapes.',
  },
  {
    icon: ImagePlus,
    title: 'Images & Media',
    body: 'Insert PNG, JPEG or WebP images, reposition with smart guides, lock aspect ratios, rotate, and adjust transparency.',
  },
  {
    icon: Layers,
    title: 'Full Page Organization',
    body: 'Reorder with drag-and-drop, rotate pages by 90°, duplicate, delete, insert blanks, or merge external PDFs.',
  },
  {
    icon: Download,
    title: 'Clean Vector PDF Export',
    body: 'Original vectors and untouched pages are preserved byte-for-byte in their content streams, maintaining publication quality.',
  },
  {
    icon: ShieldCheck,
    title: 'Complete Client-Side Privacy',
    body: 'Zero file uploads to external servers. Your documents never leave your browser, ensuring enterprise-grade confidentiality.',
  },
  {
    icon: Zap,
    title: 'Session Recovery & Autosave',
    body: 'Autosaves your editing session locally in IndexedDB so you can safely refresh or resume editing anytime without account lock-in.',
  },
]

export default function Landing() {
  const go = useApp((s) => s.go)
  const { theme, toggleTheme } = useTheme()
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="min-h-full bg-bg text-ink transition-colors">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          <nav className="hidden items-center gap-7 text-xs font-medium text-muted sm:flex">
            <button className="hover:text-ink transition-colors" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Home
            </button>
            <button className="hover:text-ink transition-colors" onClick={() => scrollTo('features')}>
              Features
            </button>
            <button className="hover:text-ink transition-colors" onClick={() => scrollTo('privacy')}>
              Privacy
            </button>
            <a className="hover:text-ink transition-colors" href={BRAND.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/5"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => go('dashboard')}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-accent-hover"
            >
              <span>Open Studio</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-6 pb-12 pt-20 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1 text-xs font-medium text-muted shadow-2xs">
            <Sparkles size={13} className="text-accent" />
            <span>Next-Generation In-Browser Document Editing</span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl font-brand">
            {BRAND.tagline}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Transform and refine PDF documents with precision. Edit text directly, select from 50+ fonts,
            reconstruct into genuine Microsoft Word (.docx) files, and annotate — completely private with zero login required.
          </p>

          {/* Value Props Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-muted">
            {KEY_HIGHLIGHTS.map((item) => (
              <div key={item} className="flex items-center gap-1.5 rounded-md bg-surface border border-line px-2.5 py-1">
                <CheckCircle2 size={13} className="text-success" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => go('dashboard')}
              className="flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-white shadow-md transition-all hover:bg-accent-hover hover:scale-[1.02]"
            >
              <span>Launch PDFly Studio</span>
              <ArrowRight size={15} />
            </button>
            <button
              onClick={() => scrollTo('features')}
              className="h-11 rounded-xl border border-line bg-surface px-6 text-sm font-semibold text-ink shadow-2xs transition-colors hover:bg-toolbar"
            >
              Explore Capabilities
            </button>
          </div>

          {/* Interactive Mockup Graphic */}
          <div className="mt-14">
            <EditorPreview />
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl font-brand">
              Built for Modern Document Editing
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-xs text-muted sm:text-sm">
              Combines the speed of client-side web technologies with publication-quality PDF manipulation.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="group rounded-2xl border border-line bg-surface p-6 shadow-2xs transition-all hover:border-accent/40 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent transition-transform group-hover:scale-110">
                  <Icon size={20} strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-ink">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy & Technical Honesty */}
        <section id="privacy" className="border-y border-line bg-surface py-20 transition-colors">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
                <Lock size={20} />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl font-brand">
                Your documents stay on your machine.
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-muted sm:text-sm">
                PDFly Studio processes every file directly inside your browser tab using WebAssembly and PDF.js.
                Files never transit across network wires, no credentials are required, and no analytics track your workflow.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-toolbar p-6 text-xs leading-relaxed text-muted shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-ink text-sm">
                <FileText size={16} className="text-accent" />
                <span>Honest about PDF Technology</span>
              </div>
              <p className="mt-3">
                PDF stores text as absolute-positioned visual glyphs rather than structured document flow. When you edit text,
                PDFly Studio preserves the underlying page, paints a pixel-perfect cover box over the original run, and re-renders
                your updated text in your chosen font with full metrics tracking.
              </p>
              <p className="mt-2">
                Exported files retain pristine vector resolution and match native PDF standards.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-muted">
        <span>© {new Date().getFullYear()} {BRAND.name} · Open Source & MIT Licensed</span>
        <div className="flex gap-5">
          <a className="hover:text-ink transition-colors" href={BRAND.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <button className="hover:text-ink transition-colors" onClick={() => scrollTo('privacy')}>
            Privacy Commitment
          </button>
          <a className="hover:text-ink transition-colors" href={`${BRAND.github}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
            License
          </a>
        </div>
      </footer>
    </div>
  )
}
