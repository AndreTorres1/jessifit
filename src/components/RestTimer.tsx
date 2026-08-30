import { useEffect, useRef, useState } from 'react'
import { Timer, Play, Pause, RotateCcw } from 'lucide-react'
import { Card } from './ui'
import { useToast } from './Toast'
import { haptic } from '@/lib/haptics'

const PRESETS = [30, 60, 90, 120]

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function RestTimer() {
  const { show } = useToast()
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const [preset, setPreset] = useState(60)
  const interval = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (!running) return
    interval.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false)
          haptic([60, 40, 60])
          show('Descanso terminado — bora! 💪')
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(interval.current)
  }, [running, show])

  const start = (secs: number) => {
    setPreset(secs)
    setRemaining(secs)
    setRunning(true)
  }

  const active = remaining > 0 || running

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Timer size={16} className="text-accent-deep" />
        <span className="text-sm font-semibold">Cronómetro de descanso</span>
      </div>

      {active ? (
        <div className="flex items-center gap-3">
          <span className="tabnums font-[var(--font-display)] text-4xl font-extrabold text-accent-deep">
            {fmt(remaining)}
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className="grid h-11 w-11 place-items-center rounded-xl bg-accent-wash text-accent-deep"
              aria-label={running ? 'Pausar' : 'Continuar'}
            >
              {running ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button
              onClick={() => {
                setRunning(false)
                setRemaining(0)
              }}
              className="grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-muted"
              aria-label="Reiniciar"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => start(s)}
              className="flex-1 rounded-xl bg-surface-2 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-accent-wash hover:text-accent-deep"
            >
              {s < 60 ? `${s}s` : `${s / 60}min`}
            </button>
          ))}
        </div>
      )}
      {!active && (
        <p className="mt-2 text-center text-xs text-muted">Último: {fmt(preset)}</p>
      )}
    </Card>
  )
}
