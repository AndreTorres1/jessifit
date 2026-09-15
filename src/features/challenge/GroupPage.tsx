import { useState } from 'react'
import {
  Users,
  Share2,
  Copy,
  Check,
  Target,
  Crown,
  Pencil,
  Plus,
  Loader2,
  ArrowLeftRight,
} from 'lucide-react'
import { useChallenge } from '@/data/challenge'
import { Card, Pill, Eyebrow, Button, EmptyState } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { shareText } from '@/lib/share'

const GOALS = [3, 4, 5, 6]

export default function GroupPage() {
  const { current, members, myUserId, isOwner, challenges, switchTo, update } = useChallenge()
  const { show } = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(current?.name ?? '')
  const [goal, setGoal] = useState(current?.weeklyGoal ?? 4)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!current) return null

  const appUrl = `${window.location.origin}${import.meta.env.BASE_URL}`
  const invite = `Junta-te ao meu desafio de treino "${current.name}" na JessiFit! 🏆\n\nCódigo: ${current.code}\n${appUrl}`

  const shareInvite = async () => {
    const r = await shareText(invite)
    if (r === 'copied') show('Convite copiado')
    else if (r === 'whatsapp') show('A abrir o WhatsApp…')
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(current.code)
      setCopied(true)
      show('Código copiado')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      show('Não consegui copiar')
    }
  }

  const saveSettings = async () => {
    setBusy(true)
    try {
      await update({ name: name.trim() || current.name, weeklyGoal: goal })
      show('Desafio atualizado')
      setEditing(false)
    } catch {
      show('Não consegui guardar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Eyebrow>Grupo</Eyebrow>
        <h1 className="text-2xl font-extrabold">{current.name}</h1>
      </div>

      {/* Código de convite */}
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Código de convite
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="font-[var(--font-mono)] text-3xl font-bold tracking-[0.25em] text-accent-deep">
            {current.code}
          </span>
          <button
            onClick={copyCode}
            className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-muted"
            aria-label="Copiar código"
          >
            {copied ? <Check size={18} className="text-accent-deep" /> : <Copy size={18} />}
          </button>
        </div>
        <Button block variant="soft" onClick={shareInvite} className="mt-3">
          <Share2 size={16} /> Partilhar convite
        </Button>
      </Card>

      {/* Definições (dono edita) */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Target size={15} /> Meta semanal
          </p>
          {isOwner && !editing && (
            <button
              onClick={() => {
                setName(current.name)
                setGoal(current.weeklyGoal)
                setEditing(true)
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted"
            >
              <Pencil size={13} /> Editar
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
              Nome do desafio
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </label>
            <div className="grid grid-cols-4 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`rounded-xl border py-2.5 text-base font-bold transition ${
                    goal === g
                      ? 'border-accent bg-accent-wash text-accent-deep'
                      : 'border-line bg-surface-2 text-muted'
                  }`}
                >
                  {g}×
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" block onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button block disabled={busy} onClick={saveSettings}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : 'Guardar'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted">
            <b className="text-ink">{current.weeklyGoal} treinos</b> por semana para cumprir a meta.
            {!isOwner && ' Definido pelo organizador.'}
          </p>
        )}
      </Card>

      {/* Participantes */}
      <div>
        <p className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
          <Users size={14} /> Participantes ({members.length})
        </p>
        {members.length === 0 ? (
          <EmptyState title="Ainda sozinho">
            Partilha o código acima para os teus colegas entrarem.
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <Card key={m.userId} className="flex items-center gap-3 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-accent-wash text-sm font-bold text-accent-deep">
                  {(m.displayName || '?').charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 truncate font-medium">
                  {m.displayName || 'Participante'}
                  {m.userId === myUserId && (
                    <span className="ml-1.5 text-xs font-normal text-muted">(tu)</span>
                  )}
                </span>
                {m.isOwner && (
                  <Pill tone="amber">
                    <Crown size={12} /> Organizador
                  </Pill>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Trocar de desafio */}
      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Outros desafios
        </p>
        <div className="flex flex-col gap-2">
          {challenges
            .filter((c) => c.id !== current.id)
            .map((c) => (
              <button
                key={c.id}
                onClick={() => switchTo(c.id)}
                className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm font-medium"
              >
                <ArrowLeftRight size={15} className="text-muted" /> {c.name}
              </button>
            ))}
          <button
            onClick={() => switchTo('')}
            className="flex items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-left text-sm font-medium text-muted"
          >
            <Plus size={15} /> Entrar / criar outro desafio
          </button>
        </div>
      </div>
    </div>
  )
}
