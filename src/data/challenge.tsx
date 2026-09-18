import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/lib/auth'
import { isDemoMode } from '@/lib/supabase'
import {
  addAthleteByEmail,
  createChallenge,
  joinChallenge,
  listMyChallenges,
  loadMembers,
  loadUserStates,
  myAthletes,
  removeMember,
  subscribeMembers,
  subscribeUserStatesChanges,
  updateChallenge,
  type Athlete,
  type Challenge,
  type Member,
  type AddAthleteResult,
} from './remote'
import { demoChallenge, demoMembers, demoAthletes } from './mock'

const CURRENT_KEY = 'jessifit:challenge:current'

interface ChallengeValue {
  loading: boolean
  challenges: Challenge[]
  current: Challenge | null
  members: Member[]
  athletes: Athlete[]
  myUserId: string | null
  myName: string
  isOwner: boolean
  create: (name: string, goal: number) => Promise<Challenge | null>
  join: (code: string) => Promise<{ ok: boolean; reason?: 'not_found' | 'error' }>
  leave: () => void
  switchTo: (id: string) => void
  update: (patch: ChallengePatch) => Promise<void>
  remove: (userId: string) => Promise<void>
  refreshMembers: () => Promise<void>
  addAthlete: (email: string) => Promise<AddAthleteResult>
  refreshAthletes: () => Promise<void>
}

type ChallengePatch = {
  name?: string
  weeklyGoal?: number
  startsOn?: string | null
  endsOn?: string | null
}

const ChallengeContext = createContext<ChallengeValue | null>(null)

function readCurrentId(): string | null {
  try {
    return localStorage.getItem(CURRENT_KEY)
  } catch {
    return null
  }
}
function writeCurrentId(id: string | null) {
  try {
    if (id) localStorage.setItem(CURRENT_KEY, id)
    else localStorage.removeItem(CURRENT_KEY)
  } catch {
    /* ignora */
  }
}

/** Membros do desafio com o estado de treino de cada um (do user_state). */
async function membersWithStates(challengeId: string): Promise<Member[]> {
  const raw = await loadMembers(challengeId)
  const states = await loadUserStates(raw.map((m) => m.userId))
  return raw.map((m) => ({ ...m, state: states[m.userId] ?? {} }))
}

export function ChallengeProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>(
    isDemoMode ? [demoChallenge] : [],
  )
  const [currentId, setCurrentId] = useState<string | null>(() =>
    isDemoMode ? demoChallenge.id : readCurrentId(),
  )
  const [members, setMembers] = useState<Member[]>(isDemoMode ? demoMembers : [])
  const [athletes, setAthletes] = useState<Athlete[]>(isDemoMode ? demoAthletes : [])
  const [loading, setLoading] = useState(!isDemoMode)

  const myUserId = isDemoMode ? 'demo-me' : (auth.user?.id ?? null)
  const myName = auth.profile?.name || 'Eu'

  const current = useMemo(
    () => challenges.find((c) => c.id === currentId) ?? null,
    [challenges, currentId],
  )

  // ---- Carregar desafios + atletas (online) --------------------------------
  const refreshAthletes = useCallback(async () => {
    if (isDemoMode) return
    try {
      setAthletes(await myAthletes())
    } catch {
      /* ignora */
    }
  }, [])

  useEffect(() => {
    if (isDemoMode) return
    if (!auth.session) {
      setChallenges([])
      setCurrentId(null)
      setMembers([])
      setAthletes([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    Promise.all([listMyChallenges(), myAthletes().catch(() => [])])
      .then(([list, ath]) => {
        if (!active) return
        setChallenges(list)
        setAthletes(ath)
        setCurrentId((prev) => {
          const saved = prev ?? readCurrentId()
          if (saved && list.some((c) => c.id === saved)) return saved
          return list[0]?.id ?? null
        })
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [auth.session])

  // ---- Carregar + subscrever membros do desafio atual (com estados) --------
  const refreshMembers = useCallback(async () => {
    if (isDemoMode || !current) return
    try {
      setMembers(await membersWithStates(current.id))
    } catch {
      /* ignora */
    }
  }, [current])

  const bump = useRef(0)
  useEffect(() => {
    if (isDemoMode || !current) {
      if (!isDemoMode) setMembers([])
      return
    }
    let active = true
    const reload = () => {
      const id = ++bump.current
      setTimeout(() => {
        if (id !== bump.current || !active) return
        membersWithStates(current.id)
          .then((m) => active && setMembers(m))
          .catch(() => {})
      }, 250)
    }
    membersWithStates(current.id)
      .then((m) => active && setMembers(m))
      .catch(() => {})
    const unsubMembers = subscribeMembers(current.id, reload)
    const unsubStates = subscribeUserStatesChanges(reload)
    return () => {
      active = false
      unsubMembers()
      unsubStates()
    }
  }, [current])

  useEffect(() => {
    if (!isDemoMode) writeCurrentId(currentId)
  }, [currentId])

  const value = useMemo<ChallengeValue>(
    () => ({
      loading,
      challenges,
      current,
      members,
      athletes,
      myUserId,
      myName,
      isOwner: !!current && !!myUserId && current.ownerId === myUserId,
      create: async (name, goal) => {
        const c = await createChallenge(name, goal)
        setChallenges((cs) => [...cs.filter((x) => x.id !== c.id), c])
        setCurrentId(c.id)
        return c
      },
      join: async (code) => {
        const r = await joinChallenge(code)
        if (!r.ok) return { ok: false, reason: r.reason }
        setChallenges((cs) => [...cs.filter((x) => x.id !== r.challenge.id), r.challenge])
        setCurrentId(r.challenge.id)
        return { ok: true }
      },
      leave: () => setCurrentId(null),
      switchTo: (id) => setCurrentId(id),
      update: async (patch) => {
        if (!current) return
        await updateChallenge(current.id, patch)
        setChallenges((cs) => cs.map((c) => (c.id === current.id ? { ...c, ...patch } : c)))
      },
      remove: async (userId) => {
        if (!current) return
        await removeMember(current.id, userId)
        setMembers((ms) => ms.filter((m) => m.userId !== userId))
      },
      refreshMembers,
      addAthlete: async (email) => {
        const r = await addAthleteByEmail(email)
        if (r.ok) setAthletes((a) => [...a.filter((x) => x.userId !== r.athlete.userId), r.athlete])
        return r
      },
      refreshAthletes,
    }),
    [loading, challenges, current, members, athletes, myUserId, myName, refreshMembers, refreshAthletes],
  )

  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChallenge(): ChallengeValue {
  const ctx = useContext(ChallengeContext)
  if (!ctx) throw new Error('useChallenge deve ser usado dentro de <ChallengeProvider>')
  return ctx
}
