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
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-[#4a4f58] transition-colors hover:bg-black/5 disabled:opacity-35 disabled:hover:bg-transparent ${
        active ? 'bg-accent-soft text-accent hover:bg-accent-soft' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
