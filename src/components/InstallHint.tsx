import { useEffect, useState } from 'react'
import { Share, X, Download, Plus } from 'lucide-react'
import { readString, writeString } from '@/lib/storage'

const DISMISS_KEY = 'jessifit:install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari iOS
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

/**
 * Convida a instalar a app no ecrã inicial. No iOS mostra instruções (o Safari
 * não permite instalação programática); no Android usa o prompt nativo.
 */
export function InstallHint() {
  const [dismissed, setDismissed] = useState(() => readString(DISMISS_KEY) === '1')
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [standalone, setStandalone] = useState(isStandalone())

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setStandalone(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = () => {
    writeString(DISMISS_KEY, '1')
    setDismissed(true)
  }

  if (standalone || dismissed) return null

  const ios = isIOS()
  // No Android só mostramos quando há prompt nativo disponível.
  if (!ios && !deferred) return null

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  return (
    <div
      className="relative mb-4 overflow-hidden rounded-2xl border border-line bg-surface p-4"
      style={{ boxShadow: 'var(--shadow)' }}
      role="note"
    >
      <button
        onClick={dismiss}
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-surface-2"
        aria-label="Dispensar"
      >
        <X size={15} />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-wash text-accent-deep">
          <Download size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Instala a JessiFit no telemóvel</p>
          {ios ? (
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Toca em <Share size={13} className="inline align-text-bottom" /> Partilhar
              e depois em <b>Adicionar ao ecrã principal</b>{' '}
              <Plus size={12} className="inline align-text-bottom" />.
            </p>
          ) : (
            <button
              onClick={install}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent-wash px-3 py-1.5 text-xs font-semibold text-accent-deep"
            >
              <Download size={14} /> Instalar app
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
