import { useState, type FormEvent } from 'react'
import { Trophy, Plus, LogIn, Loader2, Target } from 'lucide-react'
import { useChallenge } from '@/data/challenge'
import { Eyebrow, Button, EmptyState } from '@/components/ui'
import LeaderboardPage from './LeaderboardPage'

const GOALS = [3, 4, 5, 6]

export default function DesafioPage() {
  const { current } = useChallenge()
  if (current) return <LeaderboardPage />
  return <JoinCreate />
}

function JoinCreate() {
  const { create, join, challenges, switchTo } = useChallenge()
  const [tab, setTab] = useState<'join' | 'create'>('join')
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
      setError('Não consegui criar o desafio.')
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
      setError(
        r.reason === 'not_found'
          ? 'Código não encontrado. Confirma com quem te convidou.'
          : 'Não consegui entrar.',
      )
    }
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Eyebrow>Desafio</Eyebrow>
        <h1 className="text-2xl font-extrabold">Desafios de grupo</h1>
        <p className="mt-1 text-sm text-muted">
          Compete com colegas: ranking por pontos e evolução na corrida. É opcional. 🏆
        </p>
      </div>

      {challenges.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Os teus desafios
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

      <div className="flex rounded-xl bg-surface-2 p-1 text-sm font-semibold">
        {(['join', 'create'] as const).map((t) => (
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
            {t === 'join' ? <LogIn size={15} /> : <Plus size={15} />}
            {t === 'join' ? 'Entrar com código' : 'Criar desafio'}
          </button>
        ))}
      </div>

      {tab === 'join' ? (
        <form onSubmit={doJoin} className="flex flex-col gap-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ex.: AB3D9K"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={8}
            className="rounded-xl border border-line bg-surface-2 px-3 py-3 text-center font-[var(--font-mono)] text-2xl tracking-[0.3em] text-ink outline-none focus:border-accent"
          />
          {error && <p className="text-sm text-red">{error}</p>}
          <Button block disabled={busy || code.trim().length < 4} className="text-base">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <><LogIn size={18} /> Entrar no desafio</>}
          </Button>
        </form>
      ) : (
        <form onSubmit={doCreate} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Nome do desafio
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Desafio do escritório"
              className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <div className="flex flex-col gap-1.5 text-xs font-semibold text-muted">
            <span className="flex items-center gap-1.5">
              <Target size={13} /> Meta semanal (treinos/semana)
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
          </div>
          {error && <p className="text-sm text-red">{error}</p>}
          <Button block disabled={busy} className="text-base">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <><Trophy size={18} /> Criar desafio</>}
          </Button>
        </form>
      )}

      {challenges.length === 0 && (
        <EmptyState title="Sem pressão">
          Não precisas de um desafio para usar a app — treina à tua maneira nas abas Hoje e Plano.
        </EmptyState>
      )}
    </div>
  )
}
