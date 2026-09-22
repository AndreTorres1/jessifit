import { useEffect, useMemo, useState } from 'react'
import { X, Check, Sparkles, Loader2, Coffee, Share2, PlayCircle, ChevronDown } from 'lucide-react'
import type { Athlete } from '@/data/remote'
import type { WeekPlan } from '@/data/store'
import { WEEKDAY_LABEL, type Exercise } from '@/types'
import { parseWorkouts, setsRepsLabel } from '@/engine/parseWorkouts'
import { sortByWeekday } from '@/lib/format'
import { matchKey } from '@/lib/text'
import { shareText } from '@/lib/share'
import { Card, Pill, Button } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { Portal } from '@/components/Portal'
import { useEscapeKey } from '@/lib/hooks'
import {
  loadUserState,
  setAthletePlan,
  notifyAthletePlan,
  type SharedData,
} from '@/data/remote'

interface Guide {
  name: string
  videoUrl: string
  technique: string
  note: string
}

const PLACEHOLDER = `Segunda - Pernas
Agachamento 4x8 60kg
Leg press 3x12

Quarta - Peito
Supino 4x10

Sexta - Cardio
Corrida 30min

Domingo - descanso`

export function AthletePlanEditor({
  athlete,
  onClose,
  onSaved,
}: {
  athlete: Athlete
  onClose: () => void
  onSaved: () => void
}) {
  const { show } = useToast()
  useEscapeKey(onClose)

  const [loading, setLoading] = useState(true)
  const [existing, setExisting] = useState<WeekPlan | undefined>(undefined)
  const [text, setText] = useState('')
  const [coachNote, setCoachNote] = useState('')
  const [busy, setBusy] = useState(false)
  // Guias de exercício (por chave normalizada do nome).
  const [guides, setGuides] = useState<Record<string, Guide>>({})
  const [openGuide, setOpenGuide] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadUserState(athlete.userId)
      .then((s: SharedData | null) => {
        if (!active) return
        const plan = s?.plan as WeekPlan | undefined
        setExisting(plan)
        setText(plan?.rawText ?? '')
        setCoachNote(plan?.coachNote ?? '')
        const ex = (s?.exercises as Exercise[] | undefined) ?? []
        const g: Record<string, Guide> = {}
        for (const e of ex) {
          g[matchKey(e.name)] = {
            name: e.name,
            videoUrl: e.videoUrl ?? '',
            technique: e.technique ?? '',
            note: e.note ?? '',
          }
        }
        setGuides(g)
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [athlete.userId])

  const parsed = useMemo(() => parseWorkouts(text), [text])
  const days = sortByWeekday(parsed.days)
  const hasContent = text.trim().length > 0 && parsed.days.length > 0

  // Nomes de exercício únicos do plano (para associar guias).
  const exerciseNames = useMemo(() => {
    const seen = new Map<string, string>()
    for (const d of parsed.days) {
      for (const e of d.exercises) {
        const k = matchKey(e.name)
        if (k && !seen.has(k)) seen.set(k, e.name)
      }
    }
    return [...seen.entries()].map(([key, name]) => ({ key, name }))
  }, [parsed])

  const setGuide = (key: string, name: string, patch: Partial<Guide>) =>
    setGuides((g) => {
      const base: Guide = g[key] ?? { name, videoUrl: '', technique: '', note: '' }
      return { ...g, [key]: { ...base, name, ...patch } }
    })

  const save = async () => {
    if (!hasContent) return
    setBusy(true)
    const plan: WeekPlan = {
      weekNumber: existing?.weekNumber ?? 1,
      athleteName: athlete.name || 'Atleta',
      days: parsed.days,
      rawText: text,
      coachNote: coachNote.trim() || undefined,
    }
    // Guias com conteúdo → biblioteca de exercícios da atleta.
    const exercises: Exercise[] = Object.values(guides)
      .filter((g) => g.videoUrl.trim() || g.technique.trim() || g.note.trim())
      .map((g) => ({
        id: matchKey(g.name),
        name: g.name,
        muscleGroup: null,
        videoUrl: g.videoUrl.trim() || null,
        imageDataUrl: null,
        note: g.note.trim() || null,
        technique: g.technique.trim() || null,
      }))
    try {
      await setAthletePlan(athlete.userId, plan, exercises)
      void notifyAthletePlan(athlete.userId) // notificação push (best-effort)
      show(`Plano enviado para ${athlete.name} 💪`)
      onSaved()
    } catch {
      show('Não consegui guardar o plano')
    } finally {
      setBusy(false)
    }
  }

  const whatsapp = async () => {
    const appUrl = `${window.location.origin}${import.meta.env.BASE_URL}`
    const msg = `Olá ${athlete.name}! 💪 Já tens o teu plano de treino desta semana na JessiFit.\n\nAbre aqui: ${appUrl}`
    const r = await shareText(msg)
    if (r === 'copied') show('Mensagem copiada')
    else if (r === 'whatsapp') show('A abrir o WhatsApp…')
  }

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
          <h2 className="font-[var(--font-display)] text-lg font-bold">
            Plano de {athlete.name}
          </h2>
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
          <>
            <p className="mb-3 text-sm text-muted">
              Escreve ou cola o treino. A app estrutura-o e a {athlete.name} recebe-o na app dela.
            </p>

            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={9}
                placeholder={PLACEHOLDER}
                className="w-full resize-y rounded-2xl border border-line bg-surface p-4 font-[var(--font-mono)] text-sm leading-relaxed outline-none focus:border-accent"
                style={{ boxShadow: 'var(--shadow)' }}
              />
              {text.trim().length === 0 && (
                <button
                  onClick={() => setText(PLACEHOLDER)}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-accent-wash px-2.5 py-1.5 text-xs font-semibold text-accent-deep"
                >
                  <Sparkles size={13} /> Usar exemplo
                </button>
              )}
            </div>

            {hasContent && (
              <div className="mt-3 flex flex-col gap-2">
                {days.map((d) => (
                  <Card key={d.day} className="py-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-[var(--font-display)] font-bold">
                        {WEEKDAY_LABEL[d.day]}
                        {d.title && <span className="text-muted"> · {d.title}</span>}
                      </h3>
                      {d.rest && (
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <Coffee size={13} /> Descanso
                        </span>
                      )}
                    </div>
                    {d.exercises.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {d.exercises.map((ex, i) => (
                          <li key={i} className="flex items-baseline justify-between gap-2 text-sm">
                            <span className="min-w-0 flex-1 break-words">{ex.name}</span>
                            <span className="tabnums shrink-0 font-[var(--font-mono)] text-xs text-muted">
                              {setsRepsLabel(ex)}
                              {ex.weight ? ` · ${ex.weight}` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {parsed.warnings.length > 0 && (
              <p className="mt-2 text-xs text-amber">
                {parsed.warnings.length} linha(s) não percebida(s) — verifica o texto.
              </p>
            )}

            <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-muted">
              Recado para {athlete.name} (opcional)
              <input
                value={coachNote}
                onChange={(e) => setCoachNote(e.target.value)}
                placeholder="Ex.: Semana puxada, tu consegues! 💪"
                className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </label>

            {exerciseNames.length > 0 && (
              <div className="mt-4">
                <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                  <PlayCircle size={15} /> Guias de exercício (opcional)
                </p>
                <p className="mb-2 text-xs text-muted">
                  Junta um vídeo do YouTube e a técnica passo-a-passo. A {athlete.name} vê ao tocar
                  no exercício.
                </p>
                <div className="flex flex-col gap-2">
                  {exerciseNames.map(({ key, name }) => {
                    const g = guides[key]
                    const filled = !!(g && (g.videoUrl.trim() || g.technique.trim() || g.note.trim()))
                    const open = openGuide === key
                    return (
                      <div key={key} className="rounded-xl border border-line bg-surface-2">
                        <button
                          onClick={() => setOpenGuide(open ? null : key)}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium"
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: filled ? 'var(--accent)' : 'var(--line-strong)' }}
                          />
                          <span className="min-w-0 flex-1 truncate">{name}</span>
                          <ChevronDown
                            size={16}
                            className="shrink-0 text-muted transition-transform"
                            style={{ transform: open ? 'rotate(180deg)' : undefined }}
                          />
                        </button>
                        {open && (
                          <div className="flex flex-col gap-2 border-t border-line p-3">
                            <input
                              value={g?.videoUrl ?? ''}
                              onChange={(e) => setGuide(key, name, { videoUrl: e.target.value })}
                              inputMode="url"
                              placeholder="Link do YouTube"
                              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                            />
                            <textarea
                              value={g?.technique ?? ''}
                              onChange={(e) => setGuide(key, name, { technique: e.target.value })}
                              rows={5}
                              placeholder={'Técnica — um passo por linha.\nEx.:\nPés à largura dos ombros.\nDesce controlado, costas direitas.\nSobe expirando.'}
                              className="resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-accent"
                            />
                            <input
                              value={g?.note ?? ''}
                              onChange={(e) => setGuide(key, name, { note: e.target.value })}
                              placeholder="Nota curta (opcional)"
                              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {hasContent && (
              <div className="mt-4">
                <Pill tone="muted">
                  {parsed.days.filter((d) => !d.rest).length} dias de treino
                </Pill>
              </div>
            )}

            <Button block disabled={!hasContent || busy} onClick={save} className="mt-4 text-base">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> Enviar plano</>}
            </Button>
            <Button variant="soft" block onClick={whatsapp} className="mt-2">
              <Share2 size={16} /> Avisar no WhatsApp
            </Button>
            <p className="mt-2 text-center text-xs text-muted">
              Se a {athlete.name} tiver as notificações ativadas, também recebe um aviso automático.
            </p>
          </>
        )}
      </div>
    </div>
    </Portal>
  )
}
