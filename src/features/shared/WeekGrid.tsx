import { Check, X } from 'lucide-react'
import type { Weekday, WorkoutDay } from '@/types'
import { WEEKDAY_SHORT } from '@/types'
import type { Completion } from '@/data/store'
import { weekGrid, type DayCellState } from './stats'
import { todayWeekday } from '@/lib/format'

const cellStyles: Record<DayCellState, { bg: string; fg: string; border: string }> = {
  done: { bg: 'var(--accent-wash)', fg: 'var(--accent-deep)', border: 'transparent' },
  failed: { bg: 'var(--red-wash)', fg: 'var(--red)', border: 'transparent' },
  rest: { bg: 'var(--surface)', fg: 'var(--muted)', border: 'var(--line)' },
  pending: { bg: 'var(--surface)', fg: 'var(--ink-soft)', border: 'var(--line-strong)' },
  empty: { bg: 'var(--surface)', fg: 'var(--muted)', border: 'var(--line)' },
}

function CellContent({ state }: { state: DayCellState }) {
  if (state === 'done') return <Check size={15} />
  if (state === 'failed') return <X size={15} />
  if (state === 'rest') return <span>·</span>
  if (state === 'empty') return <span className="opacity-40">–</span>
  return <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
}

export function WeekGrid({
  days,
  completions,
}: {
  days: WorkoutDay[]
  completions: Partial<Record<Weekday, Completion>>
}) {
  const grid = weekGrid(days, completions)
  const today = todayWeekday()
  return (
    <div className="flex justify-between gap-1">
      {grid.map(({ day, state }) => {
        const s = cellStyles[state]
        const isToday = day === today
        return (
          <div key={day} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className="grid h-9 w-full max-w-10 place-items-center rounded-xl border text-sm"
              style={{
                background: s.bg,
                color: s.fg,
                borderColor: isToday ? 'var(--accent)' : s.border,
                borderWidth: isToday ? 2 : 1,
              }}
            >
              <CellContent state={state} />
            </div>
            <span
              className="font-[var(--font-mono)] text-[0.62rem] uppercase"
              style={{ color: isToday ? 'var(--accent-deep)' : 'var(--muted)' }}
            >
              {WEEKDAY_SHORT[day]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
