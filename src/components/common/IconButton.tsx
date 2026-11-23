import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  tip: string
  active?: boolean
  tipPos?: 'down' | 'up'
  children: ReactNode
}

export default function IconButton({ tip, active, tipPos = 'down', className = '', children, ...rest }: Props) {
  return (
    <button
      type="button"
      aria-label={tip}
      data-tip={tip}
      data-tip-pos={tipPos === 'up' ? 'up' : undefined}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-black/5 hover:text-ink dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent ${
        active ? 'bg-accent-soft text-accent font-medium shadow-2xs hover:bg-accent-soft' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
