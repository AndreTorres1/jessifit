import { X, Trophy, Target, Flame, TrendingUp, UserMinus } from 'lucide-react'
import type { Member } from '@/data/remote'
import type { WeekPlan, WeekSummary, Completion } from '@/data/store'
import type { ExerciseLog, RunLog, Weekday } from '@/types'
import { WEEKDAY_LABEL, WEEKDAYS } from '@/types'
import { Card, Pill, Button } from '@/components/ui'
import { useEscapeKey } from '@/lib/hooks'
import { WeekGrid } from '../shared/WeekGrid'
import { WeightProgress } from '../shared/WeightProgress'
import { scoreMember } from '../shared/stats'
import { runProgress, formatPace } from '@/lib/run'

interface MemberState {
  plan?: WeekPlan
  completions?: Partial<Record<Weekday, Completion>>
  history?: WeekSummary[]
  logs?: ExerciseLog[]
  runs?: RunLog[]
}

export function MemberDetail({
  member,
  goal,
  canRemove,
  onRemove,
  onClose,
}: {
  member: Member
  goal: number
  canRemove: boolean
  onRemove: () => void
  onClose: () => void
}) {
  useEscapeKey(onClose)
  const st = member.state as MemberState
  const plan = st.plan
  const completions = st.completions ?? {}
  const logs = st.logs ?? []
  const runs = st.runs ?? []
  const score = scoreMember(st, goal)
  const rp = runProgress(runs)

  const proofs = WEEKDAYS.map((d) => ({ day: d, c: completions[d] })).filter(
    (x) => x.c?.proofUrl || x.c?.note || x.c?.failReason,
  )

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40"
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
              {(member.displayName || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-[var(--font-display)] text-lg font-bold">
                {member.displayName || 'Participante'}
              </h2>
              <p className="flex items-center gap-1 text-xs text-muted">
                <Trophy size={11} /> {score.points} pts
                {member.isOwner && ' · organizador'}
              </p>
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

        <div className="flex flex-col gap-4">
          {/* Semana */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Target size={14} /> Esta semana
              </p>
              <Pill tone={score.weekGoalMet ? 'accent' : 'muted'}>
                {score.weekDone}/{goal} treinos
                {score.weekGoalMet && <Flame size={11} />}
              </Pill>
            </div>
            {plan && plan.days.length > 0 ? (
              <WeekGrid days={plan.days} completions={completions} />
            ) : (
              <p className="text-sm text-muted">Ainda sem plano definido.</p>
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

          {/* Provas e notas */}
          {proofs.length > 0 && (
            <div>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Provas e notas
              </p>
              <div className="flex flex-col gap-2">
                {proofs.map(({ day, c }) => (
                  <Card key={day} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{WEEKDAY_LABEL[day]}</span>
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
            </div>
          )}

          {/* Pesos */}
          {logs.length > 0 && (
            <div>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Registo de pesos
              </p>
              <WeightProgress logs={logs} />
            </div>
          )}

          {canRemove && (
            <Button
              variant="danger"
              block
              onClick={() => {
                if (confirm(`Remover ${member.displayName || 'este participante'} do desafio?`)) {
                  onRemove()
                }
              }}
              className="mt-2"
            >
              <UserMinus size={16} /> Remover do desafio
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
