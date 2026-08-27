import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Role, Weekday, WorkoutDay } from '@/types'
import { demoWeek } from './mock'

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

interface AppState {
  role: Role | null
  plan: WeekPlan
  completions: Partial<Record<Weekday, Completion>>
}

interface AppContextValue extends AppState {
  setRole: (role: Role | null) => void
  publishPlan: (days: WorkoutDay[], rawText: string) => void
  mark: (day: Weekday, completion: Completion) => void
  clearMark: (day: Weekday) => void
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
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as AppState
    // o papel não é persistido entre sessões — pede sempre no arranque
    return { ...initialState, ...parsed, role: null }
  } catch {
    return initialState
  }
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => load())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignora quota/privado */
    }
  }, [state])

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      setRole: (role) => setState((s) => ({ ...s, role })),
      publishPlan: (days, rawText) =>
        setState((s) => ({
          ...s,
          plan: {
            ...s.plan,
            weekNumber: s.plan.weekNumber + 1,
            days,
            rawText,
          },
          completions: {}, // nova semana começa limpa
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
