import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Exercise, ExerciseLog, Role, RunLog, Weekday, WorkoutDay } from '@/types'
import { matchKey } from '@/lib/text'
import { loadJSON, saveJSON } from '@/lib/storage'
import { isDemoMode } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useChallenge } from './challenge'
import { loadUserState, saveUserState, subscribeUserState, type SharedData } from './remote'
import { weekPointsFromCompletions } from '@/features/shared/stats'
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
  /** Nota pessoal / recado desta semana. */
  coachNote?: string
}

/** Resumo de uma semana arquivada, para o histórico. */
export interface WeekSummary {
  weekNumber: number
  done: number
  total: number
  endedAt: string // ISO
  /** Pontos ganhos nessa semana (dificuldade + bónus de meta). */
  points?: number
}

/** Fatia de estado de cada participante (persistida no Supabase, por membro). */
interface Shared {
  plan: WeekPlan
  completions: Partial<Record<Weekday, Completion>>
  exercises: Exercise[]
  history: WeekSummary[]
  logs: ExerciseLog[]
  /** Corridas registadas, para o desafio de corrida. */
  runs: RunLog[]
}

interface AppState extends Shared {
  role: Role | null
}

interface AppContextValue extends AppState {
  loading: boolean
  saving: boolean
  online: boolean
  setRole: (role: Role | null) => void
  setAthleteName: (name: string) => void
  publishPlan: (days: WorkoutDay[], rawText: string, coachNote?: string) => void
  updateCurrentPlan: (days: WorkoutDay[], rawText: string, coachNote?: string) => void
  mark: (day: Weekday, completion: Completion) => void
  clearMark: (day: Weekday) => void
  findExercise: (name: string) => Exercise | undefined
  saveExercise: (exercise: Exercise) => void
  deleteExercise: (id: string) => void
  /** Regista peso/reps feitos num exercício. */
  addLog: (name: string, weight?: string, reps?: string) => void
  /** Regista uma corrida (distância em km + tempo em segundos). */
  addRun: (distanceKm: number, seconds: number, opts?: Partial<RunLog>) => void
  deleteRun: (id: string) => void
  reset: () => void
}

const STORAGE_KEY = 'jessifit:state:v1'
const online = !isDemoMode

const emptyPlan: WeekPlan = { weekNumber: 1, athleteName: 'Atleta', days: [] }

const onlineInitial: AppState = {
  role: 'athlete',
  plan: emptyPlan,
  completions: {},
  exercises: [],
  history: [],
  logs: [],
  runs: [],
}

const demoInitial: AppState = {
  role: 'athlete',
  plan: demoWeek,
  completions: {
    segunda: {
      status: 'done',
      difficulty: 4,
      note: 'Leg press custou, subi para 40kg',
      markedAt: new Date().toISOString(),
    },
    quarta: { status: 'done', difficulty: 3, markedAt: new Date().toISOString() },
    sexta: { status: 'done', difficulty: 5, markedAt: new Date().toISOString() },
  },
  exercises: demoExercises,
  history: [
    { weekNumber: 2, done: 4, total: 4, endedAt: '2026-09-07T00:00:00.000Z', points: 17 },
    { weekNumber: 1, done: 3, total: 4, endedAt: '2026-08-31T00:00:00.000Z', points: 9 },
  ],
  logs: [
    { id: 'l1', key: 'agachamento', name: 'Agachamento', date: '2026-08-10T00:00:00.000Z', weight: '50kg', reps: '8' },
    { id: 'l2', key: 'agachamento', name: 'Agachamento', date: '2026-08-17T00:00:00.000Z', weight: '55kg', reps: '8' },
    { id: 'l3', key: 'agachamento', name: 'Agachamento', date: '2026-08-24T00:00:00.000Z', weight: '60kg', reps: '8' },
    { id: 'l4', key: 'supino', name: 'Supino', date: '2026-08-24T00:00:00.000Z', weight: '30kg', reps: '10' },
  ],
  runs: [
    { id: 'run1', date: '2026-08-24T09:00:00.000Z', distanceKm: 10, seconds: 3300, source: 'strava' },
    { id: 'run2', date: '2026-09-07T09:00:00.000Z', distanceKm: 10, seconds: 3090, source: 'strava' },
  ],
}

function summarizeWeek(state: AppState, goal: number): WeekSummary {
  const training = state.plan.days.filter((d) => !d.rest && d.exercises.length > 0)
  const done = training.filter((d) => state.completions[d.day]?.status === 'done').length
  return {
    weekNumber: state.plan.weekNumber,
    done,
    total: training.length,
    endedAt: new Date().toISOString(),
    points: weekPointsFromCompletions(state.completions, goal),
  }
}

function loadDemo(): AppState {
  const parsed = loadJSON<AppState | null>(STORAGE_KEY, null)
  if (!parsed) return demoInitial
  return { ...demoInitial, ...parsed, role: 'athlete' }
}

/** Aplica uma fatia partilhada (do backend) por cima de um estado. */
function applyShared(base: AppState, data: SharedData): AppState {
  return {
    ...base,
    plan: (data.plan as WeekPlan) ?? base.plan,
    completions: (data.completions as AppState['completions']) ?? base.completions,
    exercises: (data.exercises as Exercise[]) ?? base.exercises,
    history: (data.history as WeekSummary[]) ?? base.history,
    logs: (data.logs as ExerciseLog[]) ?? base.logs,
    runs: (data.runs as RunLog[]) ?? base.runs,
  }
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const ch = useChallenge()
  const goal = ch.current?.weeklyGoal ?? 4
  const myUserId = ch.myUserId
  const myName = ch.myName

  const [state, setState] = useState<AppState>(() => (online ? onlineInitial : loadDemo()))
  const [dataLoaded, setDataLoaded] = useState(!online)
  const [saving, setSaving] = useState(false)

  const revRef = useRef<string>('') // última revisão que nós próprios gravámos
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  // ---- Persistência demo (localStorage) ------------------------------------
  useEffect(() => {
    if (online) return
    saveJSON(STORAGE_KEY, state)
  }, [state])

  // ---- Carregar + subscrever o meu estado de treino (online) ---------------
  useEffect(() => {
    if (!online) return
    if (!auth.session || !myUserId) {
      setState(onlineInitial)
      setDataLoaded(false)
      return
    }
    let active = true
    let unsub = () => {}
    setDataLoaded(false)
    loadUserState(myUserId)
      .then((data) => {
        if (!active) return
        const base: AppState = { ...onlineInitial, role: 'athlete' }
        if (data && data.plan) setState(applyShared(base, data))
        else setState({ ...base, plan: { ...emptyPlan, athleteName: myName } })
        setDataLoaded(true)
        unsub = subscribeUserState(myUserId, (d) => {
          if (d._rev && d._rev === revRef.current) return // ignora o nosso eco
          setState((s) => applyShared(s, d))
        })
      })
      .catch(() => active && setDataLoaded(true))

    return () => {
      active = false
      unsub()
    }
  }, [auth.session, myUserId, myName])

  /** Grava a minha fatia no backend (com debounce), marcando a revisão. */
  const persist = (next: AppState) => {
    if (!online || !dataLoaded || !myUserId) return
    const rev = Math.random().toString(36).slice(2)
    revRef.current = rev
    const payload: SharedData = {
      plan: next.plan,
      completions: next.completions,
      exercises: next.exercises,
      history: next.history,
      logs: next.logs,
      runs: next.runs,
      _rev: rev,
    }
    clearTimeout(saveTimer.current)
    setSaving(true)
    saveTimer.current = setTimeout(() => {
      saveUserState(myUserId, payload)
        .catch(() => {})
        .finally(() => setSaving(false))
    }, 350)
  }

  const commit = (next: AppState) => {
    setState(next)
    persist(next)
  }

  const value = useMemo<AppContextValue>(() => {
    const loading = online && (auth.loading || (!!auth.session && !dataLoaded))

    return {
      ...state,
      role: state.role,
      loading,
      saving,
      online,
      setRole: (r) => {
        if (!online) setState((s) => ({ ...s, role: r }))
      },
      setAthleteName: (name) =>
        commit({ ...state, plan: { ...state.plan, athleteName: name } }),
      publishPlan: (days, rawText, coachNote) =>
        commit({
          ...state,
          history: [summarizeWeek(state, goal), ...state.history].slice(0, 24),
          plan: {
            ...state.plan,
            weekNumber: state.plan.weekNumber + 1,
            days,
            rawText,
            coachNote: coachNote?.trim() || undefined,
          },
          completions: {},
        }),
      updateCurrentPlan: (days, rawText, coachNote) =>
        commit({
          ...state,
          plan: { ...state.plan, days, rawText, coachNote: coachNote?.trim() || undefined },
        }),
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
      addLog: (name, weight, reps) => {
        const entry: ExerciseLog = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          key: matchKey(name),
          name,
          date: new Date().toISOString(),
          weight: weight?.trim() || undefined,
          reps: reps?.trim() || undefined,
        }
        commit({ ...state, logs: [...state.logs, entry].slice(-500) })
      },
      addRun: (distanceKm, seconds, opts) => {
        const entry: RunLog = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          date: opts?.date ?? new Date().toISOString(),
          distanceKm,
          seconds,
          source: opts?.source ?? 'manual',
          url: opts?.url?.trim() || undefined,
          note: opts?.note?.trim() || undefined,
        }
        commit({ ...state, runs: [...state.runs, entry].slice(-200) })
      },
      deleteRun: (id) => commit({ ...state, runs: state.runs.filter((r) => r.id !== id) }),
      reset: () => {
        if (online) commit({ ...onlineInitial, plan: { ...emptyPlan, athleteName: myName } })
        else setState(demoInitial)
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, auth.loading, auth.session, goal, myUserId, myName, dataLoaded, saving])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp deve ser usado dentro de <AppProvider>')
  return ctx
}
