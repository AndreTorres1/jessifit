import type { WeekSummary } from '@/data/store'
import { Card } from '@/components/ui'

function pct(s: WeekSummary): number {
  return s.total > 0 ? Math.round((s.done / s.total) * 100) : 0
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500"
        style={{
          width: `${value}%`,
          background: 'linear-gradient(90deg, var(--accent-bright), var(--accent-deep))',
        }}
      />
    </div>
  )
}

export function HistoryList({ history }: { history: WeekSummary[] }) {
  if (history.length === 0) {
    return (
      <Card className="text-center text-sm text-muted">
        Ainda não há semanas anteriores.
      </Card>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {history.map((s) => (
        <Card key={s.weekNumber} className="py-3">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-semibold">Semana {s.weekNumber}</span>
            <span className="tabnums font-[var(--font-mono)] text-xs text-muted">
              {s.done}/{s.total} · {pct(s)}%
            </span>
          </div>
          <Bar value={pct(s)} />
        </Card>
      ))}
    </div>
  )
}
