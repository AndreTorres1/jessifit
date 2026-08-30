import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, Coffee, Check, Sparkles, Copy } from 'lucide-react'
import { useApp } from '@/data/store'
import { WEEKDAY_LABEL } from '@/types'
import { parseWorkouts, setsRepsLabel } from '@/engine/parseWorkouts'
import { sortByWeekday } from '@/lib/format'
import { Card, Pill, Eyebrow, Button } from '@/components/ui'
import { useToast } from '@/components/Toast'

const PLACEHOLDER = `Segunda - Pernas
Agachamento 4x8 60kg
Leg press 3x12
Afundos 3x10 cada perna

Quarta - Peito e tríceps
Supino 4x10
Elevações 3x falha

Sexta - Cardio
Corrida 30min

Domingo - descanso`

export default function ImportPage() {
  const { plan, publishPlan, updateCurrentPlan, findExercise } = useApp()
  const { show } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const editing = (location.state as { edit?: boolean } | null)?.edit === true
  const [text, setText] = useState(() => (editing ? (plan.rawText ?? '') : ''))

  const parsed = useMemo(() => parseWorkouts(text), [text])
  const days = sortByWeekday(parsed.days)
  const hasContent = text.trim().length > 0
  const trainingCount = parsed.days.filter((d) => !d.rest).length

  // Exercícios que ainda não existem na biblioteca (para adicionar demonstração).
  const newExercises = useMemo(() => {
    const names = new Set<string>()
    for (const d of parsed.days) {
      for (const ex of d.exercises) {
        if (!findExercise(ex.name)) names.add(ex.name)
      }
    }
    return [...names]
  }, [parsed, findExercise])

  const publish = () => {
    if (editing) {
      updateCurrentPlan(parsed.days, text)
      show('Semana atualizada')
    } else {
      publishPlan(parsed.days, text)
      show(`Semana publicada para a ${plan.athleteName}`)
    }
    navigate('/painel')
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Eyebrow>Semana {editing ? plan.weekNumber : plan.weekNumber + 1}</Eyebrow>
        <h1 className="text-2xl font-extrabold">
          {editing ? 'Editar semana' : 'Importar treino'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {editing
            ? 'Ajusta o plano desta semana. As marcações já feitas são mantidas.'
            : 'Escreve ou cola o plano em texto. A app estrutura-o — confirma antes de enviar.'}
        </p>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={9}
          placeholder={PLACEHOLDER}
          className="w-full resize-y rounded-2xl border border-line bg-surface p-4 font-[var(--font-mono)] text-sm leading-relaxed outline-none focus:border-accent"
          style={{ boxShadow: 'var(--shadow)' }}
        />
        {!hasContent && (
          <div className="absolute bottom-3 right-3 flex gap-2">
            {plan.rawText && (
              <button
                onClick={() => setText(plan.rawText!)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-ink-soft"
              >
                <Copy size={13} /> Copiar última semana
              </button>
            )}
            <button
              onClick={() => setText(PLACEHOLDER)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent-wash px-2.5 py-1.5 text-xs font-semibold text-accent-deep"
            >
              <Sparkles size={13} /> Usar exemplo
            </button>
          </div>
        )}
      </div>

      {parsed.warnings.length > 0 && (
        <Card className="border-amber/40">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber">
            <AlertTriangle size={16} /> {parsed.warnings.length}{' '}
            {parsed.warnings.length === 1 ? 'linha não percebida' : 'linhas não percebidas'}
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {parsed.warnings.map((w) => (
              <li key={w.line} className="text-xs text-ink-soft">
                <span className="font-[var(--font-mono)] text-muted">L{w.line}:</span>{' '}
                <span className="line-through decoration-amber/60">{w.text}</span>
                <span className="block text-muted">{w.reason}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {hasContent && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Pré-visualização</p>
            <Pill tone="muted">
              {trainingCount} {trainingCount === 1 ? 'dia' : 'dias'} de treino
            </Pill>
          </div>
          <div className="flex flex-col gap-2.5">
            {days.map((d) => (
              <Card key={d.day} className="py-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-[var(--font-display)] font-bold">
                    {WEEKDAY_LABEL[d.day]}
                    {d.title && (
                      <span className="text-muted"> · {d.title}</span>
                    )}
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
                        <span className="min-w-0 truncate">
                          {ex.name}
                          {ex.note && (
                            <span className="text-muted"> ({ex.note})</span>
                          )}
                          {!findExercise(ex.name) && (
                            <span className="ml-1.5 align-middle text-[0.65rem] font-semibold uppercase tracking-wide text-amber">
                              novo
                            </span>
                          )}
                        </span>
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
        </div>
      )}

      {hasContent && newExercises.length > 0 && (
        <p className="rounded-xl bg-accent-wash px-4 py-3 text-xs text-accent-deep">
          {newExercises.length}{' '}
          {newExercises.length === 1 ? 'exercício novo' : 'exercícios novos'} sem
          demonstração. Depois de publicar, adiciona vídeo/foto na aba{' '}
          <b>Biblioteca</b>.
        </p>
      )}

      <Button block disabled={!hasContent || parsed.days.length === 0} onClick={publish} className="text-base">
        <Check size={18} />{' '}
        {editing ? 'Guardar alterações' : `Publicar semana para a ${plan.athleteName}`}
      </Button>
    </div>
  )
}
