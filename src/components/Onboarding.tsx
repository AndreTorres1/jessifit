import { useState } from 'react'
import { CalendarCheck, PlayCircle, Flame } from 'lucide-react'
import { readString, writeString } from '@/lib/storage'
import { Logo, Button } from './ui'

const KEY = 'jessifit:onboarded'

const STEPS = [
  {
    icon: CalendarCheck,
    title: 'O teu treino, à tua maneira',
    text: 'Monta o teu plano da semana e vê logo o treino de hoje e a semana toda.',
  },
  {
    icon: PlayCircle,
    title: 'Prova que treinaste',
    text: 'No fim de cada treino tiras uma foto como prova — e somas pontos.',
  },
  {
    icon: Flame,
    title: 'Sobe no ranking do grupo',
    text: 'Cumpre a meta semanal, ganha pontos pela dificuldade e desafia os colegas.',
  },
]

export function Onboarding() {
  const [done, setDone] = useState(() => readString(KEY) === '1')
  const [step, setStep] = useState(0)

  if (done) return null

  const finish = () => {
    writeString(KEY, '1')
    setDone(true)
  }

  const s = STEPS[step]
  const Icon = s.icon
  const last = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ground px-6">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <Logo size={56} />
        <div
          className="mt-8 grid h-16 w-16 place-items-center rounded-2xl bg-accent-wash text-accent-deep"
          key={step}
        >
          <Icon size={30} />
        </div>
        <h2 className="mt-5 font-[var(--font-display)] text-2xl font-extrabold">
          {s.title}
        </h2>
        <p className="mt-2 max-w-xs text-muted">{s.text}</p>

        <div className="mt-6 flex gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === step ? 20 : 6,
                background: i === step ? 'var(--accent)' : 'var(--line-strong)',
              }}
            />
          ))}
        </div>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
          <Button block onClick={() => (last ? finish() : setStep(step + 1))}>
            {last ? 'Começar' : 'Seguinte'}
          </Button>
          {!last && (
            <button
              onClick={finish}
              className="text-xs font-medium text-muted hover:text-ink-soft"
            >
              Saltar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
