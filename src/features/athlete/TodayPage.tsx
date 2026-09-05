import { useEffect, useState } from 'react'
import { Flame, Check, X, Coffee, CalendarX, Camera, Loader2, MessageCircle } from 'lucide-react'
import { useApp, type Completion } from '@/data/store'
import { WEEKDAY_LABEL } from '@/types'
import { todayWeekday } from '@/lib/format'
import { matchKey } from '@/lib/text'
import { Card, Pill, Eyebrow, Button, EmptyState } from '@/components/ui'
import { ProgressRing } from '@/components/ProgressRing'
import { RestTimer } from '@/components/RestTimer'
import { Confetti } from '@/components/Confetti'
import { CameraCapture } from '@/components/CameraCapture'
import { useToast } from '@/components/Toast'
import { haptic } from '@/lib/haptics'
import { uploadImage } from '@/lib/image'
import { ExerciseList } from '../shared/ExerciseList'
import { countDone, weekProgress } from '../shared/stats'

function DifficultyPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">Dificuldade</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-label={`Dificuldade ${n}`}
            className="h-6 w-6 rounded-full border transition"
            style={{
              background: n <= value ? 'var(--accent)' : 'transparent',
              borderColor: n <= value ? 'var(--accent)' : 'var(--line-strong)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function CompletionControls({ day }: { day: ReturnType<typeof todayWeekday> }) {
  const { completions, mark, clearMark } = useApp()
  const { show } = useToast()
  const existing = completions[day]
  const [mode, setMode] = useState<'idle' | 'failing' | 'camera'>('idle')
  const [difficulty, setDifficulty] = useState(existing?.difficulty ?? 3)
  const [note, setNote] = useState(existing?.note ?? '')
  const [reason, setReason] = useState(existing?.failReason ?? '')
  const [proof, setProof] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (existing && existing.status !== 'pending') {
    const done = existing.status === 'done'
    return (
      <Card className={done ? '' : 'border-red/40'}>
        <div className="flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-full"
            style={{
              background: done ? 'var(--accent-wash)' : 'var(--red-wash)',
              color: done ? 'var(--accent-deep)' : 'var(--red)',
            }}
          >
            {done ? <Check size={20} /> : <X size={20} />}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{done ? 'Treino concluído' : 'Marcaste como falhado'}</p>
            {done && existing.difficulty && (
              <p className="text-xs text-muted">Dificuldade {existing.difficulty}/5</p>
            )}
            {!done && existing.failReason && (
              <p className="text-xs text-muted">{existing.failReason}</p>
            )}
          </div>
          <Button variant="ghost" className="text-xs" onClick={() => clearMark(day)}>
            Anular
          </Button>
        </div>
        {done && existing.note && (
          <p className="mt-3 border-l-2 border-accent pl-3 text-sm italic text-ink-soft">
            “{existing.note}”
          </p>
        )}
        {done && existing.proofUrl && (
          <img
            src={existing.proofUrl}
            alt="Prova de treino"
            className="mt-3 w-full rounded-xl"
          />
        )}
      </Card>
    )
  }

  if (mode === 'camera') {
    return (
      <CameraCapture
        onClose={() => setMode('idle')}
        onCapture={async (file) => {
          setMode('idle')
          setUploading(true)
          setError(null)
          try {
            const url = await uploadImage('workout-proofs', file, 1080, 0.85)
            setProof(url)
          } catch {
            setError('Não consegui guardar a foto. Tenta de novo.')
          } finally {
            setUploading(false)
          }
        }}
      />
    )
  }

  if (mode === 'failing') {
    return (
      <Card>
        <p className="mb-2 font-semibold">O que aconteceu?</p>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex.: sem tempo, dores, viagem…"
          className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <div className="mt-3 flex gap-2">
          <Button variant="ghost" block onClick={() => setMode('idle')}>
            Voltar
          </Button>
          <Button
            variant="danger"
            block
            onClick={() =>
              mark(day, {
                status: 'failed',
                failReason: reason.trim() || undefined,
                markedAt: new Date().toISOString(),
              })
            }
          >
            Confirmar falha
          </Button>
        </div>
      </Card>
    )
  }

  const submitDone = () => {
    if (!proof) return
    const c: Completion = {
      status: 'done',
      difficulty,
      note: note.trim() || undefined,
      proofUrl: proof,
      markedAt: new Date().toISOString(),
    }
    mark(day, c)
    haptic([20, 40, 20])
    show('Boa! Treino concluído 💪')
  }

  return (
    <Card>
      {!proof ? (
        <>
          <Button
            block
            className="text-base"
            disabled={uploading}
            onClick={() => setMode('camera')}
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> A guardar foto…
              </>
            ) : (
              <>
                <Camera size={18} /> Tirar foto e concluir
              </>
            )}
          </Button>
          <p className="mt-2 text-center text-xs text-muted">
            Tira uma foto como prova — ex.: o tempo no relógio ou uma selfie no fim. 📸
          </p>
        </>
      ) : (
        <>
          <div className="relative mb-3 overflow-hidden rounded-xl">
            <img src={proof} alt="Prova de treino" className="w-full" />
            <button
              onClick={() => setMode('camera')}
              className="absolute right-2 top-2 rounded-lg bg-black/55 px-2.5 py-1 text-xs font-semibold text-white"
            >
              Repetir foto
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <DifficultyPicker value={difficulty} onChange={setDifficulty} />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Como foi? (opcional) — pesos, sensações…"
              className="w-full resize-none rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <Button block onClick={submitDone} className="mt-3 text-base">
            <Check size={18} /> Confirmar treino
          </Button>
        </>
      )}

      {error && <p className="mt-2 text-xs text-red">{error}</p>}

      <button
        onClick={() => setMode('failing')}
        className="mt-3 text-xs font-medium text-muted underline decoration-dotted"
      >
        Não consegui treinar hoje
      </button>
    </Card>
  )
}

export default function TodayPage() {
  const { plan, completions, logs, addLog } = useApp()
  const { show } = useToast()
  const today = todayWeekday()
  const day = plan.days.find((d) => d.day === today)
  const streak = countDone(completions)
  const { done, total } = weekProgress(plan.days, completions)
  const weekComplete = total > 0 && done === total

  const lastLogFor = (name: string): string | undefined => {
    const key = matchKey(name)
    const last = [...logs].reverse().find((l) => l.key === key)
    if (!last) return undefined
    return [last.weight, last.reps && `${last.reps} reps`].filter(Boolean).join(' · ')
  }

  // check-off por exercício durante o treino (apenas ajuda visual, não persiste)
  const [checkedEx, setCheckedEx] = useState<Set<number>>(new Set())
  useEffect(() => setCheckedEx(new Set()), [today])
  const toggleEx = (i: number) =>
    setCheckedEx((s) => {
      const n = new Set(s)
      n.has(i) ? n.delete(i) : n.add(i)
      return n
    })

  // dispara confetti uma vez por semana em cada sessão
  const [confetti, setConfetti] = useState(false)
  useEffect(() => {
    if (!weekComplete) return
    const key = `jessifit:celebrated:${plan.weekNumber}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      /* ignora */
    }
    setConfetti(true)
    const t = setTimeout(() => setConfetti(false), 1800)
    return () => clearTimeout(t)
  }, [weekComplete, plan.weekNumber])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Eyebrow>Semana {plan.weekNumber}</Eyebrow>
          <h1 className="text-2xl font-extrabold">{WEEKDAY_LABEL[today]}</h1>
          {streak > 0 && (
            <div className="mt-1.5">
              <Pill>
                <Flame size={13} /> {streak} {streak === 1 ? 'treino' : 'treinos'}
              </Pill>
            </div>
          )}
        </div>
        <ProgressRing value={done} total={total} label="semana" />
      </div>

      {plan.coachNote && (
        <Card className="flex items-start gap-3 border-accent/40">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-wash text-accent-deep">
            <MessageCircle size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-accent-deep">Recado do treinador</p>
            <p className="text-sm text-ink-soft">{plan.coachNote}</p>
          </div>
        </Card>
      )}

      {weekComplete && (
        <Card className="relative flex items-center gap-3 overflow-hidden border-accent/50">
          {confetti && <Confetti />}
          <div className="text-2xl">🎉</div>
          <div>
            <p className="font-[var(--font-display)] font-bold">Semana completa!</p>
            <p className="text-sm text-muted">
              Fizeste todos os treinos desta semana. Orgulho total. 🌿
            </p>
          </div>
        </Card>
      )}

      {!day && (
        <EmptyState icon={<CalendarX size={30} />} title="Sem treino definido">
          Ainda não há treino para hoje. Fala com o teu treinador. 💬
        </EmptyState>
      )}

      {day?.rest && (
        <Card className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-wash text-accent-deep">
            <Coffee size={22} />
          </div>
          <div>
            <p className="font-[var(--font-display)] text-lg font-bold">Dia de descanso</p>
            <p className="text-sm text-muted">Recupera bem — amanhã voltas com tudo. 😌</p>
          </div>
        </Card>
      )}

      {day && !day.rest && (
        <>
          <Card>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-[var(--font-display)] text-lg font-bold">
                {day.title ?? 'Treino de hoje'}
              </h2>
              <Pill tone={checkedEx.size > 0 ? 'accent' : 'muted'}>
                {checkedEx.size > 0
                  ? `${checkedEx.size}/${day.exercises.length} ✓`
                  : `${day.exercises.length} ${day.exercises.length === 1 ? 'exercício' : 'exercícios'}`}
              </Pill>
            </div>
            <ExerciseList
              items={day.exercises}
              checked={checkedEx}
              onToggle={toggleEx}
              lastLogFor={lastLogFor}
              onLog={(name, weight, reps) => {
                addLog(name, weight, reps)
                show('Peso registado 💪')
              }}
            />
          </Card>
          <CompletionControls day={today} />
          <RestTimer />
        </>
      )}
    </div>
  )
}
