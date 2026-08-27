import { Dumbbell, ClipboardList } from 'lucide-react'
import { useApp } from '@/data/store'
import { Logo, Wordmark, Button } from '@/components/ui'
import { isDemoMode } from '@/lib/supabase'

export default function LoginPage() {
  const { setRole, plan } = useApp()

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        <Logo size={64} />
        <Wordmark className="text-3xl" />
        <p className="max-w-xs text-muted">Os teus treinos da semana, num só sítio. 🌿</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => setRole('athlete')}
          className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-accent active:scale-[0.99]"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent-wash text-accent-deep">
            <Dumbbell size={22} />
          </div>
          <div>
            <p className="font-[var(--font-display)] text-lg font-bold">Sou a {plan.athleteName}</p>
            <p className="text-sm text-muted">Ver e marcar os meus treinos</p>
          </div>
        </button>

        <button
          onClick={() => setRole('coach')}
          className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-accent active:scale-[0.99]"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent-wash text-accent-deep">
            <ClipboardList size={22} />
          </div>
          <div>
            <p className="font-[var(--font-display)] text-lg font-bold">Sou o treinador</p>
            <p className="text-sm text-muted">Enviar treinos e ver o progresso</p>
          </div>
        </button>
      </div>

      {isDemoMode && (
        <p className="mt-8 rounded-xl bg-surface-2 px-4 py-3 text-center text-xs text-muted">
          Modo demonstração — dados de exemplo guardados só neste dispositivo. Liga o
          Supabase para dados reais e login.
        </p>
      )}

      <div className="mt-6 flex justify-center">
        <Button variant="ghost" onClick={() => setRole('athlete')} className="text-xs">
          Entrar
        </Button>
      </div>
    </div>
  )
}
