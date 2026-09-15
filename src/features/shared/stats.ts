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

// ---- Pontuação do desafio --------------------------------------------------

/** Bónus por cumprir a meta semanal de treinos. */
export const GOAL_BONUS = 5
/** Dificuldade assumida quando um treino foi marcado sem dificuldade. */
const DEFAULT_DIFFICULTY = 3

interface WeekLike {
  done: number
  total: number
  points?: number
}

/** Pontos de uma semana a partir das marcações: soma das dificuldades + bónus de meta. */
export function weekPointsFromCompletions(completions: Completions, goal: number): number {
  let pts = 0
  let done = 0
  for (const c of Object.values(completions)) {
    if (c?.status === 'done') {
      done++
      pts += c.difficulty ?? DEFAULT_DIFFICULTY
    }
  }
  if (goal > 0 && done >= goal) pts += GOAL_BONUS
  return pts
}

/** Pontos de uma semana arquivada (usa os guardados; se antigos, estima). */
export function weekPointsFromSummary(s: WeekLike, goal: number): number {
  if (typeof s.points === 'number') return s.points
  const base = s.done * DEFAULT_DIFFICULTY
  return base + (goal > 0 && s.done >= goal ? GOAL_BONUS : 0)
}

export interface MemberScore {
  points: number
  workouts: number
  weekDone: number
  weekGoalMet: boolean
}

/** Estado de treino de um participante, tal como guardado no backend (jsonb solto). */
interface MemberState {
  completions?: unknown
  history?: unknown
}

/** Pontuação total de um participante: semana atual + histórico. */
export function scoreMember(state: MemberState | undefined, goal: number): MemberScore {
  const completions = (state?.completions as Completions | undefined) ?? {}
  const history = (state?.history as WeekLike[] | undefined) ?? []
  const weekPts = weekPointsFromCompletions(completions, goal)
  const histPts = history.reduce((sum, w) => sum + weekPointsFromSummary(w, goal), 0)
  const weekDone = countDone(completions)
  const histWorkouts = history.reduce((sum, w) => sum + w.done, 0)
  return {
    points: weekPts + histPts,
    workouts: weekDone + histWorkouts,
    weekDone,
    weekGoalMet: goal > 0 && weekDone >= goal,
  }
}
