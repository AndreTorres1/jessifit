import { useEffect, useState } from 'react'
import { X, Target, Flame, TrendingUp, Pencil, Loader2, CalendarX } from 'lucide-react'
import type { Athlete, SharedData } from '@/data/remote'
import { loadUserState } from '@/data/remote'
import { isDemoMode } from '@/lib/supabase'
import { demoAthleteState } from '@/data/mock'
import type { WeekPlan, Completion } from '@/data/store'
import type { ExerciseLog, RunLog, Weekday } from '@/types'
import { WEEKDAY_LABEL, WEEKDAYS } from '@/types'
import { Card, Pill, Button, EmptyState } from '@/components/ui'
import { Portal } from '@/components/Portal'
import { useEscapeKey } from '@/lib/hooks'
import { WeekGrid } from '../shared/WeekGrid'
import { WeightProgress } from '../shared/WeightProgress'
import { weekProgress } from '../shared/stats'
import { runProgress, formatPace } from '@/lib/run'

interface St {
  plan?: WeekPlan
  completions?: Partial<Record<Weekday, Completion>>
  logs?: ExerciseLog[]
  runs?: RunLog[]
}

export function AthleteDetail({
  athlete,
  onClose,
  onEditPlan,
}: {
  athlete: Athlete
  onClose: () => void
  onEditPlan: () => void
}) {
  useEscapeKey(onClose)
  const [loading, setLoading] = useState(true)
  const [st, setSt] = useState<St>({})

  useEffect(() => {
    if (isDemoMode) {
      setSt(demoAthleteState() as St)
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    loadUserState(athlete.userId)
      .then((s: SharedData | null) => active && setSt((s as St) ?? {}))
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [athlete.userId])

  const plan = st.plan
  const completions = st.completions ?? {}
  const logs = st.logs ?? []
  const runs = st.runs ?? []
  const { done, total } = plan ? weekProgress(plan.days, completions) : { done: 0, total: 0 }
  const rp = runProgress(runs)
  const proofs = WEEKDAYS.map((d) => ({ day: d, c: completions[d] })).filter(
    (x) => x.c?.proofUrl || x.c?.note || x.c?.failReason || x.c?.status === 'done',
  )

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[60] overflow-y-auto bg-black/40"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="mx-auto min-h-full w-full max-w-md bg-ground p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-accent-wash text-base font-bold text-accent-deep">
                {(athlete.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-[var(--font-display)] text-lg font-bold">{athlete.name}</h2>
                <p className="text-xs text-muted">Progresso desta semana</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {loading ? (
            <div className="grid place-items-center py-16 text-muted">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Button block onClick={onEditPlan}>
                <Pencil size={16} /> Editar plano da semana
              </Button>

              {/* Semana */}
              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <Target size={14} /> Esta semana
                  </p>
                  <Pill tone={total > 0 && done === total ? 'accent' : 'muted'}>
                    {done}/{total} treinos
                    {total > 0 && done === total && <Flame size={11} />}
                  </Pill>
                </div>
                {plan && plan.days.length > 0 ? (
                  <WeekGrid days={plan.days} completions={completions} />
                ) : (
                  <p className="text-sm text-muted">Ainda não tem plano — envia um. 👆</p>
                )}
              </Card>

              {/* Corrida */}
              {rp.runs > 0 && (
                <Card>
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <TrendingUp size={14} /> Corrida
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Melhor pace</span>
                    <span className="font-[var(--font-mono)] font-semibold">
                      {formatPace(rp.bestPace)}/km
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted">Melhoria</span>
                    <span className="font-semibold text-accent-deep">
                      {rp.improvementPct > 0 ? '+' : ''}
                      {rp.improvementPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted">Total</span>
                    <span className="font-semibold">{rp.totalKm.toFixed(0)} km</span>
                  </div>
                </Card>
              )}

              {/* Provas e feedback */}
              <div>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  Provas e como se sentiu
                </p>
                {proofs.length === 0 ? (
                  <EmptyState icon={<CalendarX size={26} />} title="Sem marcações ainda">
                    Quando a {athlete.name} marcar os treinos, as fotos e notas aparecem aqui.
                  </EmptyState>
                ) : (
                  <div className="flex flex-col gap-2">
                    {proofs.map(({ day, c }) => (
                      <Card key={day} className="py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{WEEKDAY_LABEL[day]}</span>
                          {c?.status === 'done' && c.difficulty && (
                            <Pill tone="muted">Dificuldade {c.difficulty}/5</Pill>
                          )}
                          {c?.status === 'failed' && <Pill tone="red">Falhado</Pill>}
                        </div>
                        {c?.proofUrl && (
                          <a href={c.proofUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={c.proofUrl}
                              alt={`Prova de ${WEEKDAY_LABEL[day]}`}
                              className="mt-2 max-h-72 w-full rounded-xl object-cover"
                            />
                          </a>
                        )}
                        {(c?.note || c?.failReason) && (
                          <p className="mt-2 border-l-2 border-accent pl-3 text-sm italic text-ink-soft">
                            “{c?.note ?? c?.failReason}”
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Pesos */}
              {logs.length > 0 && (
                <div>
                  <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                    Registo de pesos
                  </p>
                  <WeightProgress logs={logs} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Portal>
  )
}
