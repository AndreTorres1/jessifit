import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Exercise, Role, Weekday, WorkoutDay } from '@/types'
import { matchKey } from '@/lib/text'
import { loadJSON, saveJSON } from '@/lib/storage'
import { isDemoMode } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import {
  loadShared,
  saveShared,
  subscribeShared,
  claimAccess,
  type SharedData,
} from './remote'
import { demoWeek, demoExercises } from './mock'

export interface Completion {
  status: 'done' | 'failed' | 'pending'
  difficulty?: number // 1..5
  note?: string
  failReason?: string
  markedAt?: string // ISO
  /** Foto de prova do treino (URL do Storage). */
  proofUrl?: string
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

/** Fatia partilhada do estado (persistida em localStorage ou no Supabase). */
interface Shared {
  plan: WeekPlan
  completions: Partial<Record<Weekday, Completion>>
  exercises: Exercise[]
  history: WeekSummary[]
}

interface AppState extends Shared {
  role: Role | null
}

interface AppContextValue extends AppState {
  loading: boolean
  accessDenied: boolean
  saving: boolean
  online: boolean
  setRole: (role: Role | null) => void
  setAthleteName: (name: string) => void
  publishPlan: (days: WorkoutDay[], rawText: string) => void
  updateCurrentPlan: (days: WorkoutDay[], rawText: string) => void
  mark: (day: Weekday, completion: Completion) => void
  clearMark: (day: Weekday) => void
  findExercise: (name: string) => Exercise | undefined
  saveExercise: (exercise: Exercise) => void
  deleteExercise: (id: string) => void
  reset: () => void
}

const STORAGE_KEY = 'jessifit:state:v1'
const online = !isDemoMode

const emptyPlan: WeekPlan = { weekNumber: 1, athleteName: 'Atleta', days: [] }

const onlineInitial: AppState = {
  role: null,
  plan: emptyPlan,
  completions: {},
  exercises: [],
  history: [],
}

const demoInitial: AppState = {
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

function loadDemo(): AppState {
  const parsed = loadJSON<AppState | null>(STORAGE_KEY, null)
  if (!parsed) return demoInitial
  return { ...demoInitial, ...parsed, role: null }
}

/** Aplica uma fatia partilhada (do backend) por cima de um estado. */
function applyShared(base: AppState, data: SharedData): AppState {
  return {
    ...base,
    plan: (data.plan as WeekPlan) ?? base.plan,
    completions: (data.completions as AppState['completions']) ?? base.completions,
    exercises: (data.exercises as Exercise[]) ?? base.exercises,
    history: (data.history as WeekSummary[]) ?? base.history,
  }
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const [state, setState] = useState<AppState>(() => (online ? onlineInitial : loadDemo()))
  const [dataLoaded, setDataLoaded] = useState(!online)
  const [accessDenied, setAccessDenied] = useState(false)
  const [saving, setSaving] = useState(false)

  const revRef = useRef<string>('') // última revisão que nós próprios gravámos
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  // ---- Persistência demo (localStorage) ------------------------------------
  useEffect(() => {
    if (online) return
    saveJSON(STORAGE_KEY, state)
  }, [state])

  // ---- Carregar + subscrever (online) --------------------------------------
  useEffect(() => {
    if (!online) return
    if (!auth.session) {
      setState(onlineInitial)
      setDataLoaded(false)
      setAccessDenied(false)
      return
    }
    let active = true
    let unsub = () => {}
    setDataLoaded(false)
    claimAccess()
      .then(async (ok) => {
        if (!active) return
        if (!ok) {
          setAccessDenied(true)
          setDataLoaded(true)
          return
        }
        setAccessDenied(false)
        const data = await loadShared()
        if (!active) return
        setState((s) => (data ? applyShared(s, data) : s))
        setDataLoaded(true)
        unsub = subscribeShared((d) => {
          if (d._rev && d._rev === revRef.current) return // ignora o nosso eco
          setState((s) => applyShared(s, d))
        })
      })
      .catch(() => active && setDataLoaded(true))

    return () => {
      active = false
      unsub()
    }
  }, [auth.session])

  /** Grava a fatia partilhada no backend (com debounce), marcando a revisão. */
  const persist = (next: AppState) => {
    if (!online || !dataLoaded) return
    const rev = Math.random().toString(36).slice(2)
    revRef.current = rev
    const payload: SharedData = {
      plan: next.plan,
      completions: next.completions,
      exercises: next.exercises,
      history: next.history,
      _rev: rev,
    }
    clearTimeout(saveTimer.current)
    setSaving(true)
    saveTimer.current = setTimeout(() => {
      saveShared(payload)
        .catch(() => {})
        .finally(() => setSaving(false))
    }, 350)
  }

  const commit = (next: AppState) => {
    setState(next)
    persist(next)
  }

  const value = useMemo<AppContextValue>(() => {
    const role = online ? (auth.profile?.role ?? null) : state.role
    const loading = online && (auth.loading || (!!auth.session && !dataLoaded))

    return {
      ...state,
      role,
      loading,
      accessDenied,
      saving,
      online,
      setRole: (r) => {
        if (!online) setState((s) => ({ ...s, role: r }))
      },
      setAthleteName: (name) =>
        commit({ ...state, plan: { ...state.plan, athleteName: name } }),
      publishPlan: (days, rawText) =>
        commit({
          ...state,
          history: [summarizeWeek(state), ...state.history].slice(0, 24),
          plan: { ...state.plan, weekNumber: state.plan.weekNumber + 1, days, rawText },
          completions: {},
        }),
      updateCurrentPlan: (days, rawText) =>
        commit({ ...state, plan: { ...state.plan, days, rawText } }),
      mark: (day, completion) =>
        commit({ ...state, completions: { ...state.completions, [day]: completion } }),
      clearMark: (day) => {
        const next = { ...state.completions }
        delete next[day]
        commit({ ...state, completions: next })
      },
      findExercise: (name) => {
        const key = matchKey(name)
        return state.exercises.find((e) => matchKey(e.name) === key)
      },
      saveExercise: (exercise) => {
        const exists = state.exercises.some((e) => e.id === exercise.id)
        commit({
          ...state,
          exercises: exists
            ? state.exercises.map((e) => (e.id === exercise.id ? exercise : e))
            : [...state.exercises, exercise],
        })
      },
      deleteExercise: (id) =>
        commit({ ...state, exercises: state.exercises.filter((e) => e.id !== id) }),
      reset: () => {
        if (online) commit(onlineInitial)
        else setState(demoInitial)
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, auth.profile, auth.loading, auth.session, dataLoaded, accessDenied, saving])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp deve ser usado dentro de <AppProvider>')
  return ctx
}
