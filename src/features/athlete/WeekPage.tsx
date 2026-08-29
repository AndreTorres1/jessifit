import { Coffee, Check, X } from 'lucide-react'
import { useApp } from '@/data/store'
import { WEEKDAY_LABEL } from '@/types'
import { sortByWeekday, todayWeekday } from '@/lib/format'
import { Card, Pill, Eyebrow, Button } from '@/components/ui'
import { WeekGrid } from '../shared/WeekGrid'
import { ExerciseList } from '../shared/ExerciseList'
import { HistoryList } from '../shared/HistoryList'
import { weekProgress } from '../shared/stats'

export default function WeekPage() {
  const { plan, completions, mark, clearMark, history } = useApp()
  const today = todayWeekday()
  const { done, total } = weekProgress(plan.days, completions)
  const days = sortByWeekday(plan.days)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow>Semana {plan.weekNumber}</Eyebrow>
          <h1 className="text-2xl font-extrabold">A tua semana</h1>
        </div>
        <Pill>
          {done} / {total} ✓
        </Pill>
      </div>

      <Card>
        <WeekGrid days={plan.days} completions={completions} />
      </Card>

      <div className="flex flex-col gap-3">
        {days.map((d) => {
          const c = completions[d.day]
          const isToday = d.day === today
          return (
            <Card key={d.day} className={isToday ? 'border-accent/50' : ''}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-[var(--font-display)] font-bold">
                    {WEEKDAY_LABEL[d.day]}
                  </h2>
                  {isToday && <Pill>Hoje</Pill>}
                </div>
                {d.rest ? (
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Coffee size={13} /> Descanso
                  </span>
                ) : c?.status === 'done' ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-accent-deep">
                    <Check size={14} /> Feito
                  </span>
                ) : c?.status === 'failed' ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-red">
                    <X size={14} /> Falhado
                  </span>
                ) : (
                  <span className="text-xs text-muted">Pendente</span>
                )}
              </div>

              {!d.rest && d.title && (
                <p className="text-sm text-muted">{d.title}</p>
              )}
              {!d.rest && d.exercises.length > 0 && (
                <div className="mt-2">
                  <ExerciseList items={d.exercises} />
                </div>
              )}
              {c?.status === 'failed' && c.failReason && (
                <p className="mt-2 text-xs italic text-muted">“{c.failReason}”</p>
              )}

              {!d.rest && d.exercises.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {c ? (
                    <Button
                      variant="ghost"
                      className="text-xs"
                      onClick={() => clearMark(d.day)}
                    >
                      Anular marcação
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="soft"
                        className="flex-1 text-xs"
                        onClick={() =>
                          mark(d.day, {
                            status: 'done',
                            difficulty: 3,
                            markedAt: new Date().toISOString(),
                          })
                        }
                      >
                        <Check size={15} /> Feito
                      </Button>
                      <Button
                        variant="danger"
                        className="flex-1 text-xs"
                        onClick={() =>
                          mark(d.day, {
                            status: 'failed',
                            markedAt: new Date().toISOString(),
                          })
                        }
                      >
                        <X size={15} /> Falhei
                      </Button>
                    </>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {history.length > 0 && (
        <div>
          <h2 className="mb-2 mt-2 text-sm font-semibold text-muted">
            Semanas anteriores
          </h2>
          <HistoryList history={history} />
        </div>
      )}
    </div>
  )
}
