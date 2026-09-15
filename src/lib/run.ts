import type { RunLog } from '@/types'

/**
 * Interpreta uma duração escrita como "h:mm:ss" ou "mm:ss" (também aceita
 * "42min", "42:28", "1:02:56"). Devolve segundos, ou null se inválido.
 */
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase().replace(/\s/g, '')
  if (!s) return null
  // "42min" / "42m"
  const minOnly = s.match(/^(\d+)(?:min|m)$/)
  if (minOnly) return parseInt(minOnly[1], 10) * 60
  const parts = s.split(':')
  if (parts.length < 2 || parts.length > 3) return null
  const nums = parts.map((p) => Number(p))
  if (nums.some((n) => Number.isNaN(n) || n < 0)) return null
  if (parts.length === 2) {
    const [m, sec] = nums
    if (sec >= 60) return null
    return m * 60 + sec
  }
  const [h, m, sec] = nums
  if (m >= 60 || sec >= 60) return null
  return h * 3600 + m * 60 + sec
}

/** Interpreta uma distância: "10", "10km", "10,5 km", "5k". Devolve km ou null. */
export function parseDistance(input: string): number | null {
  const s = input.trim().toLowerCase().replace(',', '.').replace(/\s/g, '')
  const m = s.match(/^(\d+(?:\.\d+)?)(?:km|k|m)?$/)
  if (!m) return null
  const val = Number(m[1])
  if (!val || val <= 0 || val > 500) return null
  return val
}

/** Formata segundos como "h:mm:ss" (esconde as horas quando são 0). */
export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

/** Pace em segundos por km. */
export function paceSeconds(run: Pick<RunLog, 'seconds' | 'distanceKm'>): number {
  if (!run.distanceKm) return 0
  return run.seconds / run.distanceKm
}

/** Formata um pace (segundos/km) como "6:18". */
export function formatPace(secPerKm: number): string {
  if (!secPerKm || !isFinite(secPerKm)) return '—'
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  // corrige o caso 6:60 → 7:00
  const mm = s === 60 ? m + 1 : m
  const ss = s === 60 ? 0 : s
  return `${mm}:${String(ss).padStart(2, '0')}`
}

export interface RunProgress {
  runs: number
  /** Pace da primeira corrida (referência), em s/km. */
  baselinePace: number
  /** Melhor pace registado, em s/km. */
  bestPace: number
  /** Pace da corrida mais recente, em s/km. */
  latestPace: number
  /** Melhoria percentual do melhor pace face à primeira corrida (positivo = mais rápido). */
  improvementPct: number
  /** Melhor corrida (menor pace). */
  best?: RunLog
  /** Total de km percorridos no desafio. */
  totalKm: number
}

/** Calcula a evolução de corrida de um participante a partir das suas corridas. */
export function runProgress(runs: RunLog[] | undefined): RunProgress {
  const list = (runs ?? []).filter((r) => r.distanceKm > 0 && r.seconds > 0)
  const empty: RunProgress = {
    runs: 0,
    baselinePace: 0,
    bestPace: 0,
    latestPace: 0,
    improvementPct: 0,
    totalKm: 0,
  }
  if (list.length === 0) return empty

  const byDate = [...list].sort((a, b) => a.date.localeCompare(b.date))
  const baselinePace = paceSeconds(byDate[0])
  const latestPace = paceSeconds(byDate[byDate.length - 1])
  let best = byDate[0]
  for (const r of byDate) {
    if (paceSeconds(r) < paceSeconds(best)) best = r
  }
  const bestPace = paceSeconds(best)
  const improvementPct =
    baselinePace > 0 ? ((baselinePace - bestPace) / baselinePace) * 100 : 0
  const totalKm = list.reduce((sum, r) => sum + r.distanceKm, 0)
  return {
    runs: list.length,
    baselinePace,
    bestPace,
    latestPace,
    improvementPct,
    best,
    totalKm,
  }
}
