import { useState } from 'react'
import { PlayCircle, ExternalLink, X } from 'lucide-react'
import type { ExerciseItem } from '@/types'
import { setsRepsLabel } from '@/engine/parseWorkouts'

/** Link de pesquisa de demonstração — placeholder até haver biblioteca com media. */
function demoSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    'como fazer ' + name + ' exercício',
  )}`
}

function DemoSheet({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center"
      onClick={onClose}
    >
      <div
        className="safe-bottom w-full max-w-md rounded-t-3xl border border-line bg-surface p-5 sm:rounded-3xl"
        style={{ boxShadow: 'var(--shadow-lift)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-[var(--font-display)] text-lg font-bold">{name}</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid aspect-video place-items-center rounded-2xl bg-surface-2 text-muted">
          <PlayCircle size={44} strokeWidth={1.4} />
        </div>
        <p className="mt-3 text-sm text-muted">
          Ainda sem vídeo próprio para este exercício. Entretanto, vê exemplos:
        </p>
        <a
          href={demoSearchUrl(name)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-wash px-4 py-3 text-sm font-semibold text-accent-deep"
        >
          <ExternalLink size={16} /> Procurar no YouTube
        </a>
      </div>
    </div>
  )
}

export function ExerciseRow({ item }: { item: ExerciseItem }) {
  const [open, setOpen] = useState(false)
  const sr = setsRepsLabel(item)
  return (
    <>
      <div className="flex items-center gap-3 py-2.5">
        <button
          onClick={() => setOpen(true)}
          className="text-accent transition hover:text-accent-deep"
          aria-label={`Ver como fazer ${item.name}`}
        >
          <PlayCircle size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.name}</p>
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
      {open && <DemoSheet name={item.name} onClose={() => setOpen(false)} />}
    </>
  )
}

export function ExerciseList({ items }: { items: ExerciseItem[] }) {
  return (
    <div className="divide-y divide-line">
      {items.map((it, i) => (
        <ExerciseRow key={i} item={it} />
      ))}
    </div>
  )
}
