import type { ExerciseLog } from '@/types'
import { Card } from '@/components/ui'

/** Progressão de pesos por exercício: mostra as últimas entradas de cada um. */
export function WeightProgress({ logs }: { logs: ExerciseLog[] }) {
  const groups = new Map<string, ExerciseLog[]>()
  for (const l of logs) {
    const arr = groups.get(l.key) ?? []
    arr.push(l)
    groups.set(l.key, arr)
  }

  const rows = [...groups.values()]
    .map((arr) => [...arr].sort((a, b) => a.date.localeCompare(b.date)))
    .sort((a, b) => b[b.length - 1].date.localeCompare(a[a.length - 1].date))

  return (
    <div className="flex flex-col gap-2">
      {rows.map((entries) => {
        const name = entries[entries.length - 1].name
        const recent = entries.slice(-6)
        return (
          <Card key={name} className="py-3">
            <p className="text-sm font-semibold">{name}</p>
            <p className="tabnums mt-1 font-[var(--font-mono)] text-xs text-ink-soft">
              {recent
                .map((e) => e.weight ?? (e.reps ? `${e.reps} reps` : '—'))
                .join('  →  ')}
            </p>
          </Card>
        )
      })}
    </div>
  )
}
