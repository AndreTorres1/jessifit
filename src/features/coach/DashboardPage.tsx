import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Flame,
  ImageIcon,
  Plus,
  Pencil,
  Share2,
  History,
  ChevronDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { useApp } from '@/data/store'
import { WEEKDAY_LABEL, type Weekday } from '@/types'
import { sortByWeekday } from '@/lib/format'
import { Card, Pill, Eyebrow, Button, EmptyState } from '@/components/ui'
import { ProgressRing } from '@/components/ProgressRing'
import { useToast } from '@/components/Toast'
import { buildWeekMessage, shareText } from '@/lib/share'
import { WeekGrid } from '../shared/WeekGrid'
import { HistoryList } from '../shared/HistoryList'
import { PlanSummary } from '../shared/PlanSummary'
import { WeightProgress } from '../shared/WeightProgress'
import { weekProgress, perfectWeekStreak } from '../shared/stats'

function SectionTitle({ icon: Icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
      {Icon && <Icon size={14} />}
      {children}
    </p>
  )
}

export default function DashboardPage() {
  const { plan, completions, history, logs } = useApp()
  const { show } = useToast()
  const navigate = useNavigate()
  const { done, total } = weekProgress(plan.days, completions)
  const streak = perfectWeekStreak({ done, total }, history)
  const hasPlan = Boolean(plan.rawText) && plan.days.length > 0
  const [showPlan, setShowPlan] = useState(false)

  const share = async () => {
    const msg = buildWeekMessage(plan.athleteName, plan.weekNumber, plan.days)
    const r = await shareText(msg)
    if (r === 'copied') show('Plano copiado para a área de transferência')
    else if (r === 'whatsapp') show('A abrir o WhatsApp…')
  }

  const feedback = sortByWeekday(plan.days)
    .map((d) => ({ day: d.day as Weekday, c: completions[d.day] }))
    .filter((x) => x.c?.note || x.c?.failReason || x.c?.proofUrl)

  return (
    <div className="flex flex-col gap-5">
      {/* Cabeçalho */}
      <div>
        <Eyebrow>Semana {plan.weekNumber}</Eyebrow>
        <h1 className="text-2xl font-extrabold">Progresso da {plan.athleteName}</h1>
      </div>

      {/* Estado da semana — tudo num cartão */}
      <Card>
        <div className="flex items-center gap-4">
          <ProgressRing value={done} total={total} size={72} />
          <div className="min-w-0 flex-1">
            <p className="font-[var(--font-display)] text-lg font-bold">
              {total > 0 ? `${done} de ${total} treinos` : 'Sem treinos definidos'}
            </p>
            <p className="text-sm text-muted">feitos esta semana</p>
            <div className="mt-1.5">
              <Pill>
                <Flame size={13} /> {streak}{' '}
                {streak === 1 ? 'semana perfeita' : 'semanas seguidas'}
              </Pill>
            </div>
          </div>
        </div>
        {plan.days.length > 0 && (
          <div className="mt-4 border-t border-line pt-4">
            <WeekGrid days={plan.days} completions={completions} />
          </div>
        )}
      </Card>

      {/* Gerir plano */}
      <div>
        <SectionTitle>Plano da semana</SectionTitle>
        <div className="flex flex-col gap-2">
          <Button block onClick={() => navigate('/importar')} className="text-base">
            <Plus size={18} /> Criar próxima semana
          </Button>
          {hasPlan && (
            <>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  block
                  onClick={() => navigate('/importar', { state: { edit: true } })}
                >
                  <Pencil size={16} /> Editar
                </Button>
                <Button variant="soft" block onClick={share}>
                  <Share2 size={16} /> Partilhar
                </Button>
              </div>
              <button
                onClick={() => setShowPlan((v) => !v)}
                className="mt-1 flex items-center justify-center gap-1 text-xs font-medium text-muted"
                aria-expanded={showPlan}
              >
                {showPlan ? 'Ocultar plano' : 'Ver plano da semana'}
                <ChevronDown
                  size={14}
                  className="transition-transform"
                  style={{ transform: showPlan ? 'rotate(180deg)' : undefined }}
                />
              </button>
              {showPlan && (
                <div className="mt-1">
                  <PlanSummary days={plan.days} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Provas e feedback */}
      <div>
        <SectionTitle icon={ImageIcon}>Provas e feedback</SectionTitle>
        {feedback.length === 0 ? (
          <EmptyState title="Ainda sem provas">
            As fotos e notas que a {plan.athleteName} deixar aparecem aqui.
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {feedback.map(({ day, c }) => (
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

      {/* Registo de pesos */}
      {logs.length > 0 && (
        <div>
          <SectionTitle icon={TrendingUp}>Registo de pesos</SectionTitle>
          <WeightProgress logs={logs} />
        </div>
      )}

      {/* Semanas anteriores */}
      {history.length > 0 && (
        <div>
          <SectionTitle icon={History}>Semanas anteriores</SectionTitle>
          <HistoryList history={history} />
        </div>
      )}
    </div>
  )
}
