import { useState, type ReactNode, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Logo, Wordmark, Button } from '@/components/ui'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    const err =
      mode === 'in'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, name.trim())
    if (err) setError(err)
    else if (mode === 'up')
      setInfo('Conta criada! Se te for pedido, confirma o email para entrares.')
    setBusy(false)
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <Logo size={64} />
        <Wordmark className="text-3xl" />
        <p className="max-w-xs text-muted">Treina com os teus colegas. Sobe no ranking. 🏆</p>
      </div>

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
          <Field label="Nome">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input"
              placeholder="O teu nome"
            />
          </Field>
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
        {info && (
          <p className="rounded-xl bg-accent-wash px-3 py-2.5 text-sm text-accent-deep">
            {info}
          </p>
        )}

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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
      {label}
      {children}
    </label>
  )
}
