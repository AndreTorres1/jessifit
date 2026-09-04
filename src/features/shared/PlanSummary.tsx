import { Coffee } from 'lucide-react'
import type { WorkoutDay } from '@/types'
import { WEEKDAY_LABEL } from '@/types'
import { setsRepsLabel } from '@/engine/parseWorkouts'
import { sortByWeekday } from '@/lib/format'
import { Card } from '@/components/ui'

/** Lista compacta e só de leitura de um plano semanal (dias + exercícios). */
export function PlanSummary({ days }: { days: WorkoutDay[] }) {
  const sorted = sortByWeekday(days)
  return (
    <div className="flex flex-col gap-2">
      {sorted.map((d) => (
        <Card key={d.day} className="py-3">
          <div className="flex items-center justify-between">
            <h3 className="font-[var(--font-display)] font-bold">
              {WEEKDAY_LABEL[d.day]}
              {d.title && <span className="text-muted"> · {d.title}</span>}
            </h3>
            {d.rest && (
              <span className="flex items-center gap-1 text-xs text-muted">
                <Coffee size={13} /> Descanso
              </span>
            )}
          </div>
          {d.exercises.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1.5">
              {d.exercises.map((ex, i) => (
                <li key={i} className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">
                    {ex.name}
                    {ex.note && <span className="text-muted"> ({ex.note})</span>}
                  </span>
                  <span className="tabnums shrink-0 font-[var(--font-mono)] text-xs text-muted">
                    {setsRepsLabel(ex)}
                    {ex.weight ? ` · ${ex.weight}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  )
}
