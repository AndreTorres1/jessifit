import { useState } from 'react'
import { X, RotateCcw } from 'lucide-react'
import { useApp } from '@/data/store'
import { useToast } from './Toast'
import { useEscapeKey } from '@/lib/hooks'
import { isDemoMode } from '@/lib/supabase'
import { Button } from './ui'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { plan, setAthleteName, reset } = useApp()
  const { show } = useToast()
  const [name, setName] = useState(plan.athleteName)
  useEscapeKey(onClose)

  const save = () => {
    const trimmed = name.trim()
    if (trimmed) setAthleteName(trimmed)
    show('Definições guardadas')
    onClose()
  }

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
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-[var(--font-display)] text-lg font-bold">Definições</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Nome da atleta
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
        </label>

        <Button block onClick={save} className="mt-4">
          Guardar
        </Button>

        {isDemoMode && (
          <div className="mt-6 border-t border-line pt-4">
            <button
              onClick={() => {
                if (confirm('Repor todos os dados de demonstração?')) {
                  reset()
                  show('Dados demo repostos')
                  onClose()
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface-2"
            >
              <RotateCcw size={15} /> Repor dados de demonstração
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
