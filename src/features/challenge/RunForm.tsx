import { useRef, useState } from 'react'
import { X, Timer, Upload, Loader2, Check } from 'lucide-react'
import { useApp } from '@/data/store'
import { useToast } from '@/components/Toast'
import { useEscapeKey } from '@/lib/hooks'
import { Button } from '@/components/ui'
import { parseDistance, parseDuration, formatDuration, formatPace, paceSeconds } from '@/lib/run'
import { parseActivityFile } from '@/lib/activityFile'
import { Portal } from '@/components/Portal'
import type { RunLog } from '@/types'

/** Mostra um número de km sem casas decimais desnecessárias. */
function niceKm(km: number): string {
  return String(Number(km.toFixed(2)))
}

const SOURCES: { value: NonNullable<RunLog['source']>; label: string }[] = [
  { value: 'strava', label: 'Strava' },
  { value: 'garmin', label: 'Garmin' },
  { value: 'other', label: 'Outro' },
]

export function RunForm({ onClose }: { onClose: () => void }) {
  const { addRun } = useApp()
  const { show } = useToast()
  useEscapeKey(onClose)

  const [distance, setDistance] = useState('')
  const [time, setTime] = useState('')
  const [source, setSource] = useState<NonNullable<RunLog['source']>>('strava')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsedDate, setParsedDate] = useState<string | undefined>(undefined)
  const fileRef = useRef<HTMLInputElement>(null)

  const km = parseDistance(distance)
  const seconds = parseDuration(time)
  const pace = km && seconds ? paceSeconds({ distanceKm: km, seconds }) : 0

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setParsing(true)
    setError(null)
    setFileName(null)
    const res = await parseActivityFile(file)
    setParsing(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setDistance(niceKm(res.distanceKm))
    setTime(formatDuration(res.seconds))
    setParsedDate(res.date)
    setSource('garmin')
    setFileName(file.name)
  }

  const save = () => {
    if (!km) return setError('Distância inválida (ex.: 10 ou 10,5).')
    if (!seconds) return setError('Tempo inválido (ex.: 42:28 ou 1:02:56).')
    addRun(km, seconds, { source, url, date: parsedDate })
    show('Corrida registada 🏃')
    onClose()
  }

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="safe-bottom max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 sm:rounded-3xl"
          style={{ boxShadow: 'var(--shadow-lift)' }}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-[var(--font-display)] text-lg font-bold">
            <Timer size={18} /> Registar corrida
          </h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".fit,.tcx,.gpx"
            className="hidden"
            onChange={(e) => {
              onFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={parsing}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface-2 py-3 text-sm font-semibold text-ink-soft transition hover:border-accent"
          >
            {parsing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> A ler ficheiro…
              </>
            ) : fileName ? (
              <>
                <Check size={16} className="text-accent-deep" /> {fileName}
              </>
            ) : (
              <>
                <Upload size={16} /> Carregar ficheiro do Garmin (.fit, .tcx, .gpx)
              </>
            )}
          </button>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> ou mete à mão{' '}
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
              Distância (km)
              <input
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                inputMode="decimal"
                placeholder="10"
                className="rf-in"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
              Tempo
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                inputMode="numeric"
                placeholder="42:28"
                className="rf-in font-[var(--font-mono)]"
              />
            </label>
          </div>

          {pace > 0 && (
            <p className="rounded-xl bg-accent-wash px-3 py-2 text-center text-sm font-semibold text-accent-deep">
              Pace {formatPace(pace)} /km
            </p>
          )}

          <div className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Origem
            <div className="grid grid-cols-3 gap-2">
              {SOURCES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSource(s.value)}
                  className={`rounded-xl border py-2 text-sm font-semibold transition ${
                    source === s.value
                      ? 'border-accent bg-accent-wash text-accent-deep'
                      : 'border-line bg-surface-2 text-muted'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Link da atividade (opcional)
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              inputMode="url"
              placeholder="https://strava.com/activities/…"
              className="rf-in"
            />
          </label>

          {error && <p className="text-sm text-red">{error}</p>}

          <Button block onClick={save} className="mt-1 text-base">
            Guardar corrida
          </Button>
        </div>

        <style>{`.rf-in{width:100%;border-radius:0.75rem;border:1px solid var(--line);background:var(--surface-2);padding:0.6rem 0.7rem;font-size:0.95rem;color:var(--ink);outline:none}.rf-in:focus{border-color:var(--accent)}`}</style>
        </div>
      </div>
    </Portal>
  )
}
