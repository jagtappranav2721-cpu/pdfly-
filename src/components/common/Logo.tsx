import { BRAND } from '../../config'

export default function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2.5 text-[15px] font-semibold tracking-tight transition-opacity hover:opacity-95"
    >
      <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-105">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M10 13h4" strokeWidth="2" />
          <path d="M10 17h2" strokeWidth="2" />
        </svg>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-brand font-bold text-ink tracking-tight">{BRAND.name}</span>
        <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
          v0.2
        </span>
      </div>
    </button>
  )
}
