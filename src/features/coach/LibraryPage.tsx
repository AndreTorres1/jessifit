import { useRef, useState, type ReactNode } from 'react'
import {
  Plus,
  Video,
  ImageIcon,
  Pencil,
  Trash2,
  X,
  Dumbbell,
  Search,
} from 'lucide-react'
import { useApp } from '@/data/store'
import type { Exercise } from '@/types'
import { youtubeId, normalize } from '@/lib/text'
import { uploadImage } from '@/lib/image'
import { useEscapeKey } from '@/lib/hooks'
import { useToast } from '@/components/Toast'
import { Card, Button, Eyebrow, EmptyState, Pill } from '@/components/ui'

function newExercise(): Exercise {
  return {
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    muscleGroup: null,
    videoUrl: null,
    imageDataUrl: null,
    note: null,
  }
}

function Editor({
  initial,
  onClose,
}: {
  initial: Exercise
  onClose: () => void
}) {
  const { saveExercise } = useApp()
  const { show } = useToast()
  const [ex, setEx] = useState<Exercise>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  useEscapeKey(onClose)

  const set = <K extends keyof Exercise>(k: K, v: Exercise[K]) =>
    setEx((e) => ({ ...e, [k]: v }))

  const onPickImage = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const url = await uploadImage('exercise-media', file, 1000, 0.82)
      setEx((e) => ({ ...e, imageUrl: url, imageDataUrl: null }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar imagem.')
    } finally {
      setBusy(false)
    }
  }

  const preview = ex.imageUrl ?? ex.imageDataUrl

  const canSave = ex.name.trim().length > 0
  const ytOk = !ex.videoUrl || youtubeId(ex.videoUrl)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="safe-bottom max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 sm:rounded-3xl"
        style={{ boxShadow: 'var(--shadow-lift)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-[var(--font-display)] text-lg font-bold">
            {initial.name ? 'Editar exercício' : 'Novo exercício'}
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
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Nome
            <input
              value={ex.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ex.: Agachamento"
              className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Grupo muscular
            <input
              value={ex.muscleGroup ?? ''}
              onChange={(e) => set('muscleGroup', e.target.value || null)}
              placeholder="Ex.: Pernas"
              className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Link de vídeo (YouTube)
            <input
              value={ex.videoUrl ?? ''}
              onChange={(e) => set('videoUrl', e.target.value || null)}
              placeholder="https://youtube.com/..."
              className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          {!ytOk && (
            <p className="-mt-1 text-xs text-amber">
              Não reconheci este link do YouTube — verifica o endereço.
            </p>
          )}

          <div className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Foto / GIF próprio
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onPickImage(f)
              }}
            />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Pré-visualização" className="w-full rounded-xl" />
                <button
                  onClick={() => setEx((e) => ({ ...e, imageUrl: null, imageDataUrl: null }))}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-black/50 text-white"
                  aria-label="Remover foto"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ) : (
              <Button
                variant="soft"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
              >
                <ImageIcon size={16} /> {busy ? 'A carregar…' : 'Escolher foto'}
              </Button>
            )}
          </div>

          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Nota (dica de execução)
            <textarea
              value={ex.note ?? ''}
              onChange={(e) => set('note', e.target.value || null)}
              rows={2}
              placeholder="Ex.: costas direitas, joelhos alinhados"
              className="resize-none rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>

          {error && <p className="text-xs text-red">{error}</p>}

          <Button
            block
            disabled={!canSave}
            onClick={() => {
              saveExercise({ ...ex, name: ex.name.trim() })
              show('Exercício guardado')
              onClose()
            }}
          >
            Guardar exercício
          </Button>
        </div>
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-accent-wash text-accent-deep'
          : 'bg-surface-2 text-muted hover:text-ink-soft'
      }`}
    >
      {children}
    </button>
  )
}

export default function LibraryPage() {
  const { exercises, deleteExercise } = useApp()
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<string | null>(null)

  const groups = [...new Set(exercises.map((e) => e.muscleGroup).filter(Boolean))].sort(
    (a, b) => a!.localeCompare(b!, 'pt'),
  ) as string[]

  const q = normalize(query)
  const sorted = [...exercises]
    .filter((e) => (group ? e.muscleGroup === group : true))
    .filter((e) => (q ? normalize(e.name).includes(q) : true))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt'))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>Biblioteca</Eyebrow>
          <h1 className="text-2xl font-extrabold">Exercícios</h1>
        </div>
        <Button onClick={() => setEditing(newExercise())}>
          <Plus size={16} /> Novo
        </Button>
      </div>

      <p className="text-sm text-muted">
        Configura a demonstração de cada exercício uma vez — reaparece sempre que o
        usares num treino.
      </p>

      {exercises.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar exercício…"
              className="w-full rounded-xl border border-line bg-surface-2 py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-accent"
            />
          </div>
          {groups.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <FilterChip active={group === null} onClick={() => setGroup(null)}>
                Todos
              </FilterChip>
              {groups.map((g) => (
                <FilterChip key={g} active={group === g} onClick={() => setGroup(g)}>
                  {g}
                </FilterChip>
              ))}
            </div>
          )}
        </div>
      )}

      {exercises.length === 0 ? (
        <EmptyState icon={<Dumbbell size={30} />} title="Biblioteca vazia">
          Adiciona o teu primeiro exercício com vídeo ou foto.
        </EmptyState>
      ) : sorted.length === 0 ? (
        <EmptyState icon={<Search size={30} />} title="Sem resultados">
          Nenhum exercício corresponde à pesquisa.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((ex) => {
            const hasVideo = Boolean(ex.videoUrl && youtubeId(ex.videoUrl))
            const img = ex.imageUrl ?? ex.imageDataUrl
            const hasImage = Boolean(img)
            return (
              <Card key={ex.id} className="flex items-center gap-3 py-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2">
                  {hasImage ? (
                    <img src={img!} alt="" className="h-full w-full object-cover" />
                  ) : hasVideo ? (
                    <Video size={20} className="text-accent" />
                  ) : (
                    <Dumbbell size={20} className="text-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{ex.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {ex.muscleGroup && <Pill tone="muted">{ex.muscleGroup}</Pill>}
                    {!hasVideo && !hasImage && (
                      <span className="text-xs text-amber">sem demonstração</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditing(ex)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2"
                  aria-label={`Editar ${ex.name}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remover "${ex.name}" da biblioteca?`)) deleteExercise(ex.id)
                  }}
                  className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-red-wash hover:text-red"
                  aria-label={`Remover ${ex.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            )
          })}
        </div>
      )}

      {editing && <Editor initial={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
