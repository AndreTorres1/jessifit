import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Exercise, Role, Weekday, WorkoutDay } from '@/types'
import { matchKey } from '@/lib/text'
import { loadJSON, saveJSON } from '@/lib/storage'
import { demoWeek, demoExercises } from './mock'

export interface Completion {
  status: 'done' | 'failed' | 'pending'
  difficulty?: number // 1..5
  note?: string
  failReason?: string
  markedAt?: string // ISO
}

export interface WeekPlan {
  weekNumber: number
  athleteName: string
  days: WorkoutDay[]
  /** Texto original importado, para reimportar/editar. */
  rawText?: string
}

/** Resumo de uma semana arquivada, para o histórico. */
export interface WeekSummary {
  weekNumber: number
  done: number
  total: number
  endedAt: string // ISO
}

interface AppState {
  role: Role | null
  plan: WeekPlan
  completions: Partial<Record<Weekday, Completion>>
  exercises: Exercise[]
  history: WeekSummary[]
}

interface AppContextValue extends AppState {
  setRole: (role: Role | null) => void
  setAthleteName: (name: string) => void
  publishPlan: (days: WorkoutDay[], rawText: string) => void
  /** Atualiza a semana atual (edição) sem arquivar nem avançar o número. */
  updateCurrentPlan: (days: WorkoutDay[], rawText: string) => void
  mark: (day: Weekday, completion: Completion) => void
  clearMark: (day: Weekday) => void
  /** Procura na biblioteca o exercício correspondente a um nome (por chave normalizada). */
  findExercise: (name: string) => Exercise | undefined
  saveExercise: (exercise: Exercise) => void
  deleteExercise: (id: string) => void
  reset: () => void
}

const STORAGE_KEY = 'jessifit:state:v1'

const initialState: AppState = {
  role: null,
  plan: demoWeek,
  completions: {
    segunda: {
      status: 'done',
      difficulty: 3,
      note: 'Leg press custou, subi para 40kg',
      markedAt: new Date().toISOString(),
    },
    quarta: { status: 'done', difficulty: 2, markedAt: new Date().toISOString() },
  },
  exercises: demoExercises,
  history: [
    { weekNumber: 2, done: 3, total: 3, endedAt: '2026-08-17T00:00:00.000Z' },
    { weekNumber: 1, done: 2, total: 3, endedAt: '2026-08-10T00:00:00.000Z' },
  ],
}

/** Resumo do progresso da semana atual, a partir do plano e das marcações. */
function summarizeWeek(state: AppState): WeekSummary {
  const training = state.plan.days.filter((d) => !d.rest && d.exercises.length > 0)
  const done = training.filter((d) => state.completions[d.day]?.status === 'done').length
  return {
    weekNumber: state.plan.weekNumber,
    done,
    total: training.length,
    endedAt: new Date().toISOString(),
  }
}

function load(): AppState {
  const parsed = loadJSON<AppState | null>(STORAGE_KEY, null)
  if (!parsed) return initialState
  // o papel não é persistido entre sessões — pede sempre no arranque
  return { ...initialState, ...parsed, role: null }
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => load())

  useEffect(() => {
    saveJSON(STORAGE_KEY, state)
  }, [state])

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      setRole: (role) => setState((s) => ({ ...s, role })),
      setAthleteName: (name) =>
        setState((s) => ({ ...s, plan: { ...s.plan, athleteName: name } })),
      publishPlan: (days, rawText) =>
        setState((s) => ({
          ...s,
          // arquiva a semana atual antes de a substituir
          history: [summarizeWeek(s), ...s.history].slice(0, 24),
          plan: {
            ...s.plan,
            weekNumber: s.plan.weekNumber + 1,
            days,
            rawText,
          },
          completions: {}, // nova semana começa limpa
        })),
      updateCurrentPlan: (days, rawText) =>
        setState((s) => ({
          ...s,
          plan: { ...s.plan, days, rawText },
        })),
      mark: (day, completion) =>
        setState((s) => ({
          ...s,
          completions: { ...s.completions, [day]: completion },
        })),
      clearMark: (day) =>
        setState((s) => {
          const next = { ...s.completions }
          delete next[day]
          return { ...s, completions: next }
        }),
      findExercise: (name) => {
        const key = matchKey(name)
        return state.exercises.find((e) => matchKey(e.name) === key)
      },
      saveExercise: (exercise) =>
        setState((s) => {
          const exists = s.exercises.some((e) => e.id === exercise.id)
          return {
            ...s,
            exercises: exists
              ? s.exercises.map((e) => (e.id === exercise.id ? exercise : e))
              : [...s.exercises, exercise],
          }
        }),
      deleteExercise: (id) =>
        setState((s) => ({
          ...s,
          exercises: s.exercises.filter((e) => e.id !== id),
        })),
      reset: () => setState(initialState),
    }),
    [state],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp deve ser usado dentro de <AppProvider>')
  return ctx
}
