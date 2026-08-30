import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'

/** Mostra um aviso quando há uma nova versão da app pronta a instalar. */
export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-4">
      <div
        className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-line bg-surface p-3 pl-4"
        style={{ boxShadow: 'var(--shadow-lift)' }}
        role="alert"
      >
        <RefreshCw size={18} className="shrink-0 text-accent" />
        <p className="flex-1 text-sm">Nova versão disponível.</p>
        <button
          onClick={() => setNeedRefresh(false)}
          className="rounded-lg px-2.5 py-2 text-xs font-medium text-muted hover:bg-surface-2"
        >
          Depois
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          className="rounded-lg px-3 py-2 text-xs font-semibold text-white"
          style={{
            background: 'linear-gradient(150deg, var(--accent-bright), var(--accent-deep))',
          }}
        >
          Atualizar
        </button>
      </div>
    </div>
  )
}
