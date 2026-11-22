import { BRAND } from '../../config'

export default function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
          <path d="M1 1h6l4 4v8H1z" fill="#fff" />
        </svg>
      </span>
      {BRAND.name}
    </button>
  )
}
