import { useState } from 'react'
import { PlayCircle, ExternalLink, X, Info, Check } from 'lucide-react'
import type { Exercise, ExerciseItem } from '@/types'
import { setsRepsLabel } from '@/engine/parseWorkouts'
import { youtubeId, demoSearchUrl } from '@/lib/text'
import { useApp } from '@/data/store'
import { useEscapeKey } from '@/lib/hooks'

function DemoSheet({
  name,
  exercise,
  onClose,
}: {
  name: string
  exercise: Exercise | undefined
  onClose: () => void
}) {
  const ytId = exercise?.videoUrl ? youtubeId(exercise.videoUrl) : null
  const img = exercise?.imageUrl ?? exercise?.imageDataUrl
  useEscapeKey(onClose)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="safe-bottom w-full max-w-md rounded-t-3xl border border-line bg-surface p-5 sm:rounded-3xl"
        style={{ boxShadow: 'var(--shadow-lift)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-[var(--font-display)] text-lg font-bold">{name}</h3>
            {exercise?.muscleGroup && (
              <p className="text-xs text-muted">{exercise.muscleGroup}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {ytId ? (
          <div className="aspect-video overflow-hidden rounded-2xl bg-black">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${ytId}`}
              title={`Demonstração — ${name}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : img ? (
          <img src={img} alt={`Demonstração — ${name}`} className="w-full rounded-2xl" />
        ) : (
          <div className="grid aspect-video place-items-center rounded-2xl bg-surface-2 text-muted">
            <PlayCircle size={44} strokeWidth={1.4} />
          </div>
        )}

        {exercise?.note && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-accent-wash px-3 py-2.5 text-sm text-accent-deep">
            <Info size={16} className="mt-0.5 shrink-0" /> {exercise.note}
          </p>
        )}

        {!ytId && !img && (
          <>
            <p className="mt-3 text-sm text-muted">
              Ainda sem demonstração própria. Entretanto, vê exemplos:
            </p>
            <a
              href={demoSearchUrl(name)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-wash px-4 py-3 text-sm font-semibold text-accent-deep"
            >
              <ExternalLink size={16} /> Procurar no YouTube
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export function ExerciseRow({
  item,
  checked,
  onToggle,
}: {
  item: ExerciseItem
  checked?: boolean
  onToggle?: () => void
}) {
  const { findExercise } = useApp()
  const [open, setOpen] = useState(false)
  const exercise = findExercise(item.name)
  const hasDemo = Boolean(exercise?.videoUrl || exercise?.imageDataUrl)
  const sr = setsRepsLabel(item)

  return (
    <>
      <div className="flex items-center gap-3 py-2.5">
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label={checked ? `Desmarcar ${item.name}` : `Marcar ${item.name} como feito`}
            aria-pressed={checked}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full border transition"
            style={{
              background: checked ? 'var(--accent)' : 'transparent',
              borderColor: checked ? 'var(--accent)' : 'var(--line-strong)',
              color: '#fff',
            }}
          >
            {checked && <Check size={14} />}
          </button>
        )}
        <button
          onClick={() => setOpen(true)}
          className={hasDemo ? 'text-accent transition hover:text-accent-deep' : 'text-muted'}
          aria-label={`Ver como fazer ${item.name}`}
          title={hasDemo ? 'Ver demonstração' : 'Procurar demonstração'}
        >
          <PlayCircle size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-medium ${
              checked ? 'text-muted line-through' : ''
            }`}
          >
            {item.name}
          </p>
          {item.note && <p className="truncate text-xs text-muted">{item.note}</p>}
        </div>
        <div className="text-right">
          {sr && (
            <p className="tabnums font-[var(--font-mono)] text-sm text-ink-soft">{sr}</p>
          )}
          {item.weight && (
            <p className="tabnums font-[var(--font-mono)] text-xs text-muted">
              {item.weight}
            </p>
          )}
        </div>
      </div>
      {open && (
        <DemoSheet name={item.name} exercise={exercise} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

export function ExerciseList({
  items,
  checked,
  onToggle,
}: {
  items: ExerciseItem[]
  checked?: Set<number>
  onToggle?: (index: number) => void
}) {
  return (
    <div className="divide-y divide-line">
      {items.map((it, i) => (
        <ExerciseRow
          key={i}
          item={it}
          checked={checked?.has(i)}
          onToggle={onToggle ? () => onToggle(i) : undefined}
        />
      ))}
    </div>
  )
}
