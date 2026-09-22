import { useState } from 'react'
import { X, RotateCcw, Bell, BellOff, Loader2, Check } from 'lucide-react'
import { useApp } from '@/data/store'
import { useChallenge } from '@/data/challenge'
import { useToast } from './Toast'
import { useEscapeKey } from '@/lib/hooks'
import { isDemoMode } from '@/lib/supabase'
import { pushState, enablePush, disablePush } from '@/lib/push'
import { Button } from './ui'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { plan, setAthleteName, reset } = useApp()
  const { myUserId } = useChallenge()
  const { show } = useToast()
  const [name, setName] = useState(plan.athleteName)
  const [pSt, setPSt] = useState(() => pushState())
  const [pBusy, setPBusy] = useState(false)
  useEscapeKey(onClose)

  const enableNotifs = async () => {
    if (!myUserId) return
    setPBusy(true)
    const r = await enablePush(myUserId)
    setPBusy(false)
    setPSt(pushState())
    if (r === 'ok') show('Notificações ativadas ✓')
    else if (r === 'denied') show('Notificações bloqueadas nas definições do telemóvel')
    else if (r === 'need-install') show('Adiciona a app ao ecrã inicial primeiro')
    else if (r === 'unsupported') show('Este telemóvel não suporta notificações')
    else show('Não consegui ativar. Tenta de novo.')
  }

  const disableNotifs = async () => {
    setPBusy(true)
    await disablePush()
    setPBusy(false)
    setPSt(pushState())
    show('Notificações desativadas')
  }

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

        {!isDemoMode && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Bell size={15} /> Notificações
            </p>
            {pSt === 'unsupported' ? (
              <p className="text-xs text-muted">Este telemóvel não suporta notificações.</p>
            ) : pSt === 'need-install' ? (
              <p className="text-xs text-muted">
                No iPhone: toca em <b>Partilhar</b> → <b>Adicionar ao ecrã inicial</b>, abre a app
                por aí e volta aqui para ativar.
              </p>
            ) : pSt === 'granted' ? (
              <button
                onClick={disableNotifs}
                disabled={pBusy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-medium text-ink-soft"
              >
                {pBusy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} className="text-accent-deep" />}
                Notificações ativadas — desativar
              </button>
            ) : (
              <>
                <button
                  onClick={enableNotifs}
                  disabled={pBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(150deg, var(--accent-bright), var(--accent-deep))' }}
                >
                  {pBusy ? <Loader2 size={15} className="animate-spin" /> : <BellOff size={15} />}
                  Ativar notificações de treino
                </button>
                <p className="mt-2 text-xs text-muted">
                  Recebe um aviso quando o teu treinador enviar o plano da semana.
                </p>
              </>
            )}
          </div>
        )}

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
