import { useMemo, useState } from 'react'
import { Trophy, Target, Flame, Medal } from 'lucide-react'
import { useChallenge } from '@/data/challenge'
import { Card, Pill, Eyebrow, EmptyState } from '@/components/ui'
import { scoreMember, type MemberScore } from '../shared/stats'
import RunningBoard from './RunningBoard'

interface Row extends MemberScore {
  userId: string
  name: string
  isOwner: boolean
  isMe: boolean
  rank: number
}

const MEDAL = ['#F5C542', '#B8C0CC', '#CD8B5B'] // ouro, prata, bronze

export default function LeaderboardPage() {
  const { current, members, myUserId } = useChallenge()
  const goal = current?.weeklyGoal ?? 4
  const [view, setView] = useState<'points' | 'run'>('points')

  const rows = useMemo<Row[]>(() => {
    const scored = members.map((m) => ({
      userId: m.userId,
      name: m.displayName || 'Participante',
      isOwner: m.isOwner,
      isMe: m.userId === myUserId,
      ...scoreMember(m.state, goal),
    }))
    scored.sort((a, b) => b.points - a.points || b.workouts - a.workouts)
    return scored.map((r, i) => ({ ...r, rank: i + 1 }))
  }, [members, goal, myUserId])

  const me = rows.find((r) => r.isMe)
  const metCount = rows.filter((r) => r.weekGoalMet).length

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Eyebrow>{current?.name ?? 'Desafio'}</Eyebrow>
        <h1 className="text-2xl font-extrabold">Ranking</h1>
      </div>

      <div className="flex rounded-xl bg-surface-2 p-1 text-sm font-semibold">
        {([['points', 'Pontos'], ['run', 'Corrida']] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-lg py-2 transition ${
              view === v ? 'bg-surface text-ink' : 'text-muted'
            }`}
            style={view === v ? { boxShadow: 'var(--shadow)' } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'run' && <RunningBoard />}
      {view === 'points' && <PointsBoard rows={rows} goal={goal} me={me} metCount={metCount} />}
    </div>
  )
}

function PointsBoard({
  rows,
  goal,
  me,
  metCount,
}: {
  rows: Row[]
  goal: number
  me: Row | undefined
  metCount: number
}) {
  return (
    <>
      {/* Resumo */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-wash text-accent-deep">
            <Trophy size={26} />
          </div>
          <div className="min-w-0 flex-1">
            {me ? (
              <>
                <p className="font-[var(--font-display)] text-lg font-bold">
                  Estás em {me.rank}º de {rows.length}
                </p>
                <p className="text-sm text-muted">
                  {me.points} pts · {me.weekDone}/{goal} treinos esta semana
                </p>
              </>
            ) : (
              <>
                <p className="font-[var(--font-display)] text-lg font-bold">
                  {rows.length} {rows.length === 1 ? 'participante' : 'participantes'}
                </p>
                <p className="text-sm text-muted">A pontuação atualiza-se em tempo real.</p>
              </>
            )}
          </div>
          <Pill tone="muted">
            <Target size={12} /> meta {goal}×
          </Pill>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState icon={<Trophy size={30} />} title="Ainda sem participantes">
          Partilha o código do desafio na aba <b>Grupo</b> para os teus colegas entrarem.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => {
            const medal = r.rank <= 3 ? MEDAL[r.rank - 1] : null
            return (
              <Card
                key={r.userId}
                className={`py-3 ${r.isMe ? 'border-accent/60' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold"
                    style={{
                      background: medal ? medal : 'var(--surface-2)',
                      color: medal ? '#1a1a1a' : 'var(--muted)',
                    }}
                  >
                    {medal ? <Medal size={18} /> : r.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-semibold">
                      <span className="truncate">{r.name}</span>
                      {r.isMe && <span className="text-xs font-medium text-accent-deep">(tu)</span>}
                    </p>
                    <p className="flex items-center gap-2 text-xs text-muted">
                      <span>{r.workouts} treinos</span>
                      {r.weekGoalMet && (
                        <span className="inline-flex items-center gap-0.5 text-accent-deep">
                          <Flame size={11} /> meta cumprida
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabnums font-[var(--font-display)] text-lg font-bold text-accent-deep">
                      {r.points}
                    </p>
                    <p className="-mt-1 text-[0.65rem] uppercase tracking-wide text-muted">pts</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {rows.length > 0 && (
        <p className="px-1 text-center text-xs text-muted">
          {metCount} de {rows.length} já cumpriram a meta desta semana. 💪
        </p>
      )}
    </>
  )
}
