import { useNavigate } from 'react-router-dom'
import { Flame, MessageSquareQuote, Plus } from 'lucide-react'
import { useApp } from '@/data/store'
import { WEEKDAY_LABEL, type Weekday } from '@/types'
import { sortByWeekday } from '@/lib/format'
import { Card, Pill, Eyebrow, Button, EmptyState } from '@/components/ui'
import { ProgressRing } from '@/components/ProgressRing'
import { WeekGrid } from '../shared/WeekGrid'
import { weekProgress, countDone } from '../shared/stats'

export default function DashboardPage() {
  const { plan, completions } = useApp()
  const navigate = useNavigate()
  const { done, total } = weekProgress(plan.days, completions)
  const streak = countDone(completions)

  const feedback = sortByWeekday(plan.days)
    .map((d) => ({ day: d.day as Weekday, c: completions[d.day] }))
    .filter((x) => x.c?.note || x.c?.failReason)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Eyebrow>Semana {plan.weekNumber}</Eyebrow>
        <h1 className="text-2xl font-extrabold">Progresso da {plan.athleteName}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center justify-center gap-2 py-5 text-center">
          <ProgressRing value={done} total={total} size={84} />
          <p className="text-xs text-muted">treinos esta semana</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-5 text-center">
          <p className="tabnums flex items-center gap-1 font-[var(--font-display)] text-4xl font-extrabold text-accent-deep">
            <Flame size={26} /> {streak}
          </p>
          <p className="mt-1 text-xs text-muted">dias em dia</p>
        </Card>
      </div>

      <Card>
        <p className="mb-3 text-sm font-semibold">Cumprimento da semana</p>
        <WeekGrid days={plan.days} completions={completions} />
      </Card>

      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <MessageSquareQuote size={16} /> Feedback dela
        </p>
        {feedback.length === 0 ? (
          <EmptyState title="Ainda sem feedback">
            As notas que a {plan.athleteName} deixar aparecem aqui.
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {feedback.map(({ day, c }) => (
              <Card key={day} className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{WEEKDAY_LABEL[day]}</span>
                  {c?.status === 'done' && c.difficulty && (
                    <Pill tone="muted">Dificuldade {c.difficulty}/5</Pill>
                  )}
                  {c?.status === 'failed' && <Pill tone="red">Falhado</Pill>}
                </div>
                <p className="mt-1 border-l-2 border-accent pl-3 text-sm italic text-ink-soft">
                  “{c?.note ?? c?.failReason}”
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Button block onClick={() => navigate('/importar')} className="text-base">
        <Plus size={18} /> Criar próxima semana
      </Button>
    </div>
  )
}
