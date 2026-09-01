import { useState, type ReactNode, type FormEvent } from 'react'
import { Dumbbell, ClipboardList, Loader2 } from 'lucide-react'
import { useApp } from '@/data/store'
import { useAuth } from '@/lib/auth'
import { isDemoMode } from '@/lib/supabase'
import { Logo, Wordmark, Button } from '@/components/ui'
import type { Role } from '@/types'

export default function LoginPage() {
  if (isDemoMode) return <DemoLogin />
  return <OnlineLogin />
}

/** Login demo — seleção de perfil, sem backend. */
function DemoLogin() {
  const { setRole, plan } = useApp()
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 py-10">
      <Header />
      <div className="flex flex-col gap-3">
        <RoleCard
          icon={<Dumbbell size={22} />}
          title={`Sou a ${plan.athleteName}`}
          subtitle="Ver e marcar os meus treinos"
          onClick={() => setRole('athlete')}
        />
        <RoleCard
          icon={<ClipboardList size={22} />}
          title="Sou o treinador"
          subtitle="Enviar treinos e ver o progresso"
          onClick={() => setRole('coach')}
        />
      </div>
      <p className="mt-8 rounded-xl bg-surface-2 px-4 py-3 text-center text-xs text-muted">
        Modo demonstração — dados de exemplo guardados só neste dispositivo.
      </p>
    </div>
  )
}

/** Login online — email + palavra-passe, com registo. */
function OnlineLogin() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('athlete')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err =
      mode === 'in'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, name.trim(), role)
    if (err) setError(err)
    setBusy(false)
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 py-10">
      <Header />

      <div className="mb-4 flex rounded-xl bg-surface-2 p-1 text-sm font-semibold">
        {(['in', 'up'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m)
              setError(null)
            }}
            className={`flex-1 rounded-lg py-2 transition ${
              mode === m ? 'bg-surface text-ink shadow-sm' : 'text-muted'
            }`}
            style={mode === m ? { boxShadow: 'var(--shadow)' } : undefined}
          >
            {m === 'in' ? 'Entrar' : 'Criar conta'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        {mode === 'up' && (
          <>
            <Field label="Nome">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input"
                placeholder="O teu nome"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <RolePick active={role === 'athlete'} onClick={() => setRole('athlete')}>
                <Dumbbell size={16} /> Atleta
              </RolePick>
              <RolePick active={role === 'coach'} onClick={() => setRole('coach')}>
                <ClipboardList size={16} /> Treinador
              </RolePick>
            </div>
          </>
        )}
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="input"
            placeholder="email@exemplo.com"
          />
        </Field>
        <Field label="Palavra-passe">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            className="input"
            placeholder="••••••••"
          />
        </Field>

        {error && <p className="text-sm text-red">{error}</p>}

        <Button block disabled={busy} className="mt-1 text-base">
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : mode === 'in' ? (
            'Entrar'
          ) : (
            'Criar conta'
          )}
        </Button>
      </form>

      <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid var(--line);background:var(--surface-2);padding:0.65rem 0.75rem;font-size:0.9rem;color:var(--ink);outline:none}.input:focus{border-color:var(--accent)}`}</style>
    </div>
  )
}

function Header() {
  return (
    <div className="mb-8 flex flex-col items-center gap-4 text-center">
      <Logo size={64} />
      <Wordmark className="text-3xl" />
      <p className="max-w-xs text-muted">Os teus treinos da semana, num só sítio. 🌿</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
      {label}
      {children}
    </label>
  )
}

function RoleCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-accent active:scale-[0.99]"
      style={{ boxShadow: 'var(--shadow)' }}
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent-wash text-accent-deep">
        {icon}
      </div>
      <div>
        <p className="font-[var(--font-display)] text-lg font-bold">{title}</p>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
    </button>
  )
}

function RolePick({
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
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-semibold transition ${
        active
          ? 'border-accent bg-accent-wash text-accent-deep'
          : 'border-line bg-surface-2 text-muted'
      }`}
    >
      {children}
    </button>
  )
}
