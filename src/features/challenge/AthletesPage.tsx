import { useState, type FormEvent } from 'react'
import { Users, Plus, Loader2, ChevronRight, Dumbbell } from 'lucide-react'
import { useChallenge } from '@/data/challenge'
import type { Athlete } from '@/data/remote'
import { Card, Eyebrow, Button, EmptyState } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { AthletePlanEditor } from './AthletePlanEditor'

export default function AthletesPage() {
  const { athletes, addAthlete } = useChallenge()
  const { show } = useToast()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Athlete | null>(null)

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setError(null)
    const r = await addAthlete(email.trim())
    setBusy(false)
    if (r.ok) {
      show(`${r.athlete.name} adicionado 💪`)
      setEmail('')
    } else if (r.reason === 'not_found') {
      setError('Não há conta com esse email. Pede-lhe para criar conta primeiro.')
    } else if (r.reason === 'self') {
      setError('Esse email és tu 🙂')
    } else {
      setError('Não consegui adicionar. Tenta de novo.')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Eyebrow>Treinador</Eyebrow>
        <h1 className="text-2xl font-extrabold">Os meus atletas</h1>
        <p className="mt-1 text-sm text-muted">
          Adiciona alguém pelo email e envia-lhe o plano da semana. Ela recebe-o na app dela.
        </p>
      </div>

      <Card>
        <form onSubmit={add} className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted">Adicionar atleta (email)</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
            <Button disabled={busy || !email.trim()} className="shrink-0">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Adicionar</>}
            </Button>
          </div>
          {error && <p className="text-sm text-red">{error}</p>}
        </form>
      </Card>

      {athletes.length === 0 ? (
        <EmptyState icon={<Users size={30} />} title="Ainda não treinas ninguém">
          Adiciona a Jessica ou a Lu pelo email da conta delas para começares a enviar treinos.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-2">
          {athletes.map((a) => (
            <button
              key={a.userId}
              onClick={() => setEditing(a)}
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left transition active:scale-[0.99]"
              style={{ boxShadow: 'var(--shadow)' }}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-wash text-sm font-bold text-accent-deep">
                {(a.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{a.name || 'Atleta'}</p>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <Dumbbell size={11} /> Editar plano da semana
                </p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-muted" />
            </button>
          ))}
        </div>
      )}

      {editing && (
        <AthletePlanEditor
          athlete={editing}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}
    </div>
  )
}
