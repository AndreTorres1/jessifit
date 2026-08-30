import type { Weekday, WorkoutDay } from '@/types'
import { WEEKDAYS } from '@/types'
import type { Completion } from '@/data/store'

type Completions = Partial<Record<Weekday, Completion>>

/** Número de treinos marcados como feitos. */
export function countDone(completions: Completions): number {
  return Object.values(completions).filter((c) => c?.status === 'done').length
}

/** Dias de treino (não-descanso) do plano. */
export function trainingDays(days: WorkoutDay[]): WorkoutDay[] {
  return days.filter((d) => !d.rest && d.exercises.length > 0)
}

/** Progresso: feitos / total de dias de treino. */
export function weekProgress(
  days: WorkoutDay[],
  completions: Completions,
): { done: number; total: number } {
  const training = trainingDays(days)
  const done = training.filter((d) => completions[d.day]?.status === 'done').length
  return { done, total: training.length }
}

/**
 * Número de semanas perfeitas (todos os treinos feitos) seguidas, a contar da
 * mais recente. Inclui a semana atual apenas se já estiver completa.
 */
export function perfectWeekStreak(
  current: { done: number; total: number },
  history: { done: number; total: number }[],
): number {
  const weeks = [current, ...history]
  let streak = 0
  for (const w of weeks) {
    if (w.total > 0 && w.done === w.total) streak++
    else break
  }
  return streak
}

/** Estado de cada dia da semana para a grelha (feito/falhado/descanso/pendente/vazio). */
export type DayCellState = 'done' | 'failed' | 'rest' | 'pending' | 'empty'

export function weekGrid(
  days: WorkoutDay[],
  completions: Completions,
): { day: Weekday; state: DayCellState }[] {
  return WEEKDAYS.map((day) => {
    const plan = days.find((d) => d.day === day)
    if (!plan) return { day, state: 'empty' as const }
    if (plan.rest) return { day, state: 'rest' as const }
    const c = completions[day]
    if (c?.status === 'done') return { day, state: 'done' as const }
    if (c?.status === 'failed') return { day, state: 'failed' as const }
    return { day, state: 'pending' as const }
  })
}
