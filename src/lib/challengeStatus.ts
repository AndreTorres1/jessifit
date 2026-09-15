export type ChallengeState = 'upcoming' | 'running' | 'ended'

export interface ChallengeStatus {
  state: ChallengeState
  /** Dias até terminar (quando a decorrer e há data de fim). */
  endsInDays?: number
  /** Dias até começar (quando ainda não começou). */
  startsInDays?: number
}

function dateOnly(d: Date): Date {
  return new Date(d.toISOString().slice(0, 10) + 'T00:00:00')
}

/** Estado do desafio em função das datas de início/fim. */
export function challengeStatus(
  c: { startsOn?: string | null; endsOn?: string | null },
  today: Date = new Date(),
): ChallengeStatus {
  const t = dateOnly(today)
  const s = c.startsOn ? new Date(c.startsOn + 'T00:00:00') : null
  const e = c.endsOn ? new Date(c.endsOn + 'T00:00:00') : null
  const day = 86400000

  if (s && t < s) {
    return { state: 'upcoming', startsInDays: Math.ceil((s.getTime() - t.getTime()) / day) }
  }
  if (e && t > e) return { state: 'ended' }
  const endsInDays = e ? Math.round((e.getTime() - t.getTime()) / day) : undefined
  return { state: 'running', endsInDays }
}
