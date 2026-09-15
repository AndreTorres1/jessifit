import { useState, type FormEvent } from 'react'
import { Trophy, Plus, LogIn, Loader2, Target } from 'lucide-react'
import { useChallenge } from '@/data/challenge'
import { useAuth } from '@/lib/auth'
import { Logo, Wordmark, Button } from '@/components/ui'

const GOALS = [3, 4, 5, 6]

export default function GatePage() {
  const { create, join, challenges, switchTo } = useChallenge()
  const { signOut } = useAuth()
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [goal, setGoal] = useState(4)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const doCreate = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await create(name.trim() || 'O nosso desafio', goal)
    } catch {
      setError('Não consegui criar o desafio. Tenta de novo.')
    } finally {
      setBusy(false)
    }
  }

  const doJoin = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const r = await join(code.trim())
    if (!r.ok) {
      setError(r.reason === 'not_found' ? 'Código não encontrado. Confirma com quem te convidou.' : 'Não consegui entrar. Tenta de novo.')
    }
    setBusy(false)
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-7 flex flex-col items-center gap-3 text-center">
        <Logo size={56} />
        <Wordmark className="text-2xl" />
        <p className="max-w-xs text-sm text-muted">
          Cria um desafio de treino com os teus colegas — ou entra com um código. 🏆
        </p>
      </div>

      {challenges.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Voltar a um desafio
          </p>
          <div className="flex flex-col gap-2">
            {challenges.map((c) => (
              <button
                key={c.id}
                onClick={() => switchTo(c.id)}
                className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm font-semibold"
                style={{ boxShadow: 'var(--shadow)' }}
              >
                <span className="truncate">{c.name}</span>
                <span className="font-[var(--font-mono)] text-xs text-muted">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex rounded-xl bg-surface-2 p-1 text-sm font-semibold">
        {(['create', 'join'] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t)
              setError(null)
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              tab === t ? 'bg-surface text-ink' : 'text-muted'
            }`}
            style={tab === t ? { boxShadow: 'var(--shadow)' } : undefined}
          >
            {t === 'create' ? <Plus size={15} /> : <LogIn size={15} />}
            {t === 'create' ? 'Criar desafio' : 'Entrar com código'}
          </button>
        ))}
      </div>

      {tab === 'create' ? (
        <form onSubmit={doCreate} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Nome do desafio
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Desafio do escritório"
              className="input"
            />
          </label>

          <div className="flex flex-col gap-1.5 text-xs font-semibold text-muted">
            <span className="flex items-center gap-1.5">
              <Target size={13} /> Meta semanal (treinos por semana)
            </span>
            <div className="grid grid-cols-4 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={`rounded-xl border py-3 text-lg font-bold transition ${
                    goal === g
                      ? 'border-accent bg-accent-wash text-accent-deep'
                      : 'border-line bg-surface-2 text-muted'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <p className="font-normal text-muted">
              Quem treinar {goal}× ou mais por semana cumpre a meta e ganha pontos extra.
            </p>
          </div>

          {error && <p className="text-sm text-red">{error}</p>}

          <Button block disabled={busy} className="text-base">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <><Trophy size={18} /> Criar desafio</>}
          </Button>
        </form>
      ) : (
        <form onSubmit={doJoin} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Código do desafio
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex.: AB3D9K"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={8}
              className="input text-center font-[var(--font-mono)] text-2xl tracking-[0.3em]"
            />
          </label>
          {error && <p className="text-sm text-red">{error}</p>}
          <Button block disabled={busy || code.trim().length < 4} className="text-base">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <><LogIn size={18} /> Entrar no desafio</>}
          </Button>
        </form>
      )}

      <button
        onClick={() => void signOut()}
        className="mt-8 text-center text-xs font-medium text-muted"
      >
        Terminar sessão
      </button>

      <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid var(--line);background:var(--surface-2);padding:0.65rem 0.75rem;font-size:0.9rem;color:var(--ink);outline:none}.input:focus{border-color:var(--accent)}`}</style>
    </div>
  )
}
