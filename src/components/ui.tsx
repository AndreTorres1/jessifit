import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Logótipo JessiFit — haltere estilizado num quadrado verde. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-xl"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(150deg, var(--accent-bright), var(--accent-deep))',
        boxShadow: 'var(--shadow-lift)',
      }}
      aria-hidden
    >
      <svg
        width={size * 0.56}
        height={size * 0.56}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6.5 6.5l11 11M4 9l-1.5 1.5a2.1 2.1 0 0 0 0 3L4 15M20 15l1.5-1.5a2.1 2.1 0 0 0 0-3L20 9M8 4.5 6.5 6M17.5 18 16 19.5" />
      </svg>
    </div>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-[var(--font-display)] font-extrabold tracking-tight ${className}`}
    >
      Jessi<span style={{ color: 'var(--accent-deep)' }}>Fit</span>
    </span>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'soft' | 'danger'
  block?: boolean
}

export function Button({
  variant = 'primary',
  block,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'
  const styles: Record<string, string> = {
    primary: 'text-white',
    ghost: 'bg-transparent text-ink-soft hover:bg-surface-2',
    soft: 'bg-accent-wash text-accent-deep hover:brightness-95',
    danger: 'bg-red-wash text-red hover:brightness-95',
  }
  const inline =
    variant === 'primary'
      ? { background: 'linear-gradient(150deg, var(--accent-bright), var(--accent-deep))' }
      : undefined
  return (
    <button
      className={`${base} ${styles[variant]} ${block ? 'w-full' : ''} ${className}`}
      style={inline}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface p-4 ${className}`}
      style={{ boxShadow: 'var(--shadow)' }}
    >
      {children}
    </div>
  )
}

export function Pill({
  children,
  tone = 'accent',
}: {
  children: ReactNode
  tone?: 'accent' | 'amber' | 'red' | 'muted'
}) {
  const tones: Record<string, string> = {
    accent: 'bg-accent-wash text-accent-deep',
    amber: 'bg-amber-wash text-amber',
    red: 'bg-red-wash text-red',
    muted: 'bg-surface-2 text-muted',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold font-[var(--font-mono)] ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="font-[var(--font-mono)] text-[0.7rem] font-medium uppercase tracking-[0.16em] text-accent-deep">
      {children}
    </span>
  )
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon?: ReactNode
  title: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong bg-surface-2/50 px-6 py-10 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <p className="font-[var(--font-display)] text-lg font-bold">{title}</p>
      {children && <p className="max-w-xs text-sm text-muted">{children}</p>}
    </div>
  )
}
