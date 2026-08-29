interface Props {
  value: number
  total: number
  size?: number
  stroke?: number
  label?: string
}

/** Anel de progresso circular (SVG) — feitos / total. Respeita prefers-reduced-motion. */
export function ProgressRing({ value, total, size = 72, stroke = 8, label }: Props) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = total > 0 ? Math.min(1, value / total) : 0
  const offset = circumference * (1 - pct)

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line-strong)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="tabnums font-[var(--font-display)] text-lg font-extrabold text-ink">
          {value}
          <span className="text-sm text-muted">/{total}</span>
        </span>
        {label && <span className="mt-0.5 text-[0.6rem] uppercase text-muted">{label}</span>}
      </div>
    </div>
  )
}
