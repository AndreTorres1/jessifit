import { useMemo, useState } from 'react'
import { Plus, TrendingUp, ExternalLink, Trash2, Timer } from 'lucide-react'
import { useChallenge } from '@/data/challenge'
import { useApp } from '@/data/store'
import { Card, Button, EmptyState } from '@/components/ui'
import type { RunLog } from '@/types'
import { runProgress, formatPace, formatDuration, paceSeconds } from '@/lib/run'
import { RunForm } from './RunForm'

/** Percentagem de melhoria que enche a barra por completo. */
const FULL_BAR_PCT = 15

interface Row {
  userId: string
  name: string
  isMe: boolean
  improvementPct: number
  bestPace: number
  runs: number
  totalKm: number
  best?: RunLog
}

export default function RunningBoard() {
  const { members, myUserId } = useChallenge()
  const { runs: myRuns } = useApp()
  const [formOpen, setFormOpen] = useState(false)

  const rows = useMemo<Row[]>(() => {
    const list = members.map((m) => {
      const runs = m.userId === myUserId ? myRuns : ((m.state.runs as RunLog[] | undefined) ?? [])
      const p = runProgress(runs)
      return {
        userId: m.userId,
        name: m.displayName || 'Participante',
        isMe: m.userId === myUserId,
        improvementPct: p.improvementPct,
        bestPace: p.bestPace,
        runs: p.runs,
        totalKm: p.totalKm,
        best: p.best,
      }
    })
    // quem corre fica à frente; ordena por melhoria, depois por melhor pace
    list.sort((a, b) => {
      if (a.runs === 0 && b.runs === 0) return 0
      if (a.runs === 0) return 1
      if (b.runs === 0) return -1
      return b.improvementPct - a.improvementPct || a.bestPace - b.bestPace
    })
    return list
  }, [members, myUserId, myRuns])

  const runnersCount = rows.filter((r) => r.runs > 0).length

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-wash text-accent-deep">
          <TrendingUp size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Evolução na corrida</p>
          <p className="text-xs text-muted">
            Melhoria de pace desde a tua primeira corrida do desafio.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="shrink-0">
          <Plus size={16} /> Corrida
        </Button>
      </Card>

      {runnersCount === 0 ? (
        <EmptyState icon={<Timer size={30} />} title="Ainda sem corridas">
          Regista a tua primeira corrida (Strava/Garmin) para começar a acompanhar a
          evolução do grupo.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => {
            const has = r.runs > 0
            const width = Math.max(0, Math.min(r.improvementPct / FULL_BAR_PCT, 1)) * 100
            const improved = r.improvementPct > 0.05
            return (
              <Card key={r.userId} className={`py-3 ${r.isMe ? 'border-accent/60' : ''}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="flex items-center gap-1.5 font-semibold">
                    <span className="truncate">{r.name}</span>
                    {r.isMe && <span className="text-xs font-medium text-accent-deep">(tu)</span>}
                  </p>
                  <span
                    className="tabnums font-[var(--font-display)] text-lg font-bold"
                    style={{ color: improved ? 'var(--accent-deep)' : 'var(--muted)' }}
                  >
                    {has && r.runs > 1
                      ? `${improved ? '+' : ''}${r.improvementPct.toFixed(1)}%`
                      : '—'}
                  </span>
                </div>

                {/* barra de melhoria */}
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${width}%`,
                      background: 'linear-gradient(90deg, var(--accent-bright), var(--accent-deep))',
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                  {has ? (
                    <>
                      <span>
                        Melhor pace <b className="text-ink">{formatPace(r.bestPace)}</b>/km
                      </span>
                      {r.best && (
                        <span>
                          · {r.best.distanceKm}km em {formatDuration(r.best.seconds)}
                        </span>
                      )}
                      <span className="ml-auto">{r.totalKm.toFixed(0)}km no total</span>
                    </>
                  ) : (
                    <span>Sem corridas ainda</span>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* As minhas corridas */}
      {myRuns.length > 0 && <MyRuns />}

      {formOpen && <RunForm onClose={() => setFormOpen(false)} />}
    </div>
  )
}

function MyRuns() {
  const { runs, deleteRun } = useApp()
  const ordered = [...runs].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <div>
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
        As minhas corridas
      </p>
      <div className="flex flex-col gap-2">
        {ordered.map((r) => (
          <Card key={r.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {r.distanceKm}km · {formatDuration(r.seconds)}
              </p>
              <p className="text-xs text-muted">
                Pace {formatPace(paceSeconds(r))}/km ·{' '}
                {new Date(r.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                {r.source && r.source !== 'manual' ? ` · ${r.source}` : ''}
              </p>
            </div>
            {r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
                aria-label="Abrir atividade"
              >
                <ExternalLink size={15} />
              </a>
            )}
            <button
              onClick={() => deleteRun(r.id)}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
              aria-label="Apagar corrida"
            >
              <Trash2 size={15} />
            </button>
          </Card>
        ))}
      </div>
    </div>
  )
}
