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
  createChallenge,
  joinChallenge,
  listMyChallenges,
  loadMembers,
  removeMember,
  subscribeMembers,
  updateChallenge,
  type Challenge,
  type Member,
} from './remote'
import { demoChallenge, demoMembers } from './mock'

const CURRENT_KEY = 'jessifit:challenge:current'

interface ChallengeValue {
  loading: boolean
  challenges: Challenge[]
  current: Challenge | null
  members: Member[]
  myUserId: string | null
  myName: string
  isOwner: boolean
  create: (name: string, goal: number) => Promise<Challenge | null>
  join: (code: string) => Promise<{ ok: boolean; reason?: 'not_found' | 'error' }>
  switchTo: (id: string) => void
  update: (patch: ChallengePatch) => Promise<void>
  remove: (userId: string) => Promise<void>
  refreshMembers: () => Promise<void>
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

export function ChallengeProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>(
    isDemoMode ? [demoChallenge] : [],
  )
  const [currentId, setCurrentId] = useState<string | null>(() =>
    isDemoMode ? demoChallenge.id : readCurrentId(),
  )
  const [members, setMembers] = useState<Member[]>(isDemoMode ? demoMembers : [])
  const [loading, setLoading] = useState(!isDemoMode)

  const myUserId = isDemoMode ? 'demo-me' : (auth.user?.id ?? null)
  const myName = auth.profile?.name || 'Eu'

  const current = useMemo(
    () => challenges.find((c) => c.id === currentId) ?? null,
    [challenges, currentId],
  )

  // ---- Carregar a lista de desafios (online) -------------------------------
  useEffect(() => {
    if (isDemoMode) return
    if (!auth.session) {
      setChallenges([])
      setCurrentId(null)
      setMembers([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    listMyChallenges()
      .then((list) => {
        if (!active) return
        setChallenges(list)
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

  // ---- Carregar + subscrever membros do desafio atual ----------------------
  const refreshMembers = useCallback(async () => {
    if (isDemoMode || !current) return
    try {
      setMembers(await loadMembers(current.id))
    } catch {
      /* ignora */
    }
  }, [current])

  const bump = useRef(0)
  useEffect(() => {
    if (isDemoMode || !current) return
    let active = true
    loadMembers(current.id)
      .then((m) => active && setMembers(m))
      .catch(() => {})
    const unsub = subscribeMembers(current.id, () => {
      // recarrega (debounce simples via microtask flag)
      const id = ++bump.current
      setTimeout(() => {
        if (id !== bump.current) return
        loadMembers(current.id)
          .then((m) => setMembers(m))
          .catch(() => {})
      }, 250)
    })
    return () => {
      active = false
      unsub()
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
    }),
    [loading, challenges, current, members, myUserId, myName, refreshMembers],
  )

  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChallenge(): ChallengeValue {
  const ctx = useContext(ChallengeContext)
  if (!ctx) throw new Error('useChallenge deve ser usado dentro de <ChallengeProvider>')
  return ctx
}
