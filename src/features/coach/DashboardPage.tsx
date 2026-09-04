import { useNavigate } from 'react-router-dom'
import { Flame, MessageSquareQuote, Plus, Pencil, Share2 } from 'lucide-react'
import { useApp } from '@/data/store'
import { WEEKDAY_LABEL, type Weekday } from '@/types'
import { sortByWeekday } from '@/lib/format'
import { Card, Pill, Eyebrow, Button, EmptyState } from '@/components/ui'
import { ProgressRing } from '@/components/ProgressRing'
import { useToast } from '@/components/Toast'
import { buildWeekMessage, shareText } from '@/lib/share'
import { WeekGrid } from '../shared/WeekGrid'
import { HistoryList } from '../shared/HistoryList'
import { weekProgress, perfectWeekStreak } from '../shared/stats'

export default function DashboardPage() {
  const { plan, completions, history } = useApp()
  const { show } = useToast()
  const navigate = useNavigate()
  const { done, total } = weekProgress(plan.days, completions)
  const streak = perfectWeekStreak({ done, total }, history)

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
          <p className="mt-1 text-xs text-muted">
            {streak === 1 ? 'semana perfeita' : 'semanas seguidas'}
          </p>
        </Card>
      </div>

      <Card>
        <p className="mb-3 text-sm font-semibold">Cumprimento da semana</p>
        <WeekGrid days={plan.days} completions={completions} />
      </Card>

      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <MessageSquareQuote size={16} /> Provas e feedback
        </p>
        {feedback.length === 0 ? (
          <EmptyState title="Ainda sem provas">
            As fotos e notas que a {plan.athleteName} deixar aparecem aqui.
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
                {c?.proofUrl && (
                  <a href={c.proofUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={c.proofUrl}
                      alt={`Prova de ${WEEKDAY_LABEL[day]}`}
                      className="mt-2 w-full rounded-xl"
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

      {history.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Semanas anteriores</p>
          <HistoryList history={history} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button block onClick={() => navigate('/importar')} className="text-base">
          <Plus size={18} /> Criar próxima semana
        </Button>
        {plan.rawText && (
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
        )}
      </div>
    </div>
  )
}
