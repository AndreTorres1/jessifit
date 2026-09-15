import { supabase } from '@/lib/supabase'

/** Estado de treino de um participante (plano, marcações, exercícios, etc.). */
export interface SharedData {
  plan?: unknown
  completions?: unknown
  exercises?: unknown
  history?: unknown
  logs?: unknown
  /** Marca de revisão para ignorar ecos das nossas próprias gravações. */
  _rev?: string
}

/** Um desafio de grupo. */
export interface Challenge {
  id: string
  code: string
  name: string
  weeklyGoal: number
  ownerId: string
  createdAt: string
}

/** Um participante do desafio + o seu estado de treino. */
export interface Member {
  userId: string
  displayName: string
  isOwner: boolean
  state: SharedData
  updatedAt: string
}

interface ChallengeRow {
  id: string
  code: string
  name: string
  weekly_goal: number
  owner_id: string
  created_at: string
}

interface MemberRow {
  challenge_id: string
  user_id: string
  display_name: string
  is_owner: boolean
  state: SharedData
  updated_at: string
}

function toChallenge(r: ChallengeRow): Challenge {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    weeklyGoal: r.weekly_goal,
    ownerId: r.owner_id,
    createdAt: r.created_at,
  }
}

function toMember(r: MemberRow): Member {
  return {
    userId: r.user_id,
    displayName: r.display_name,
    isOwner: r.is_owner,
    state: r.state ?? {},
    updatedAt: r.updated_at,
  }
}

// ---- Desafios --------------------------------------------------------------

export async function listMyChallenges(): Promise<Challenge[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('my_challenges')
  if (error) throw error
  return ((data as ChallengeRow[]) ?? []).map(toChallenge)
}

export async function createChallenge(name: string, goal: number): Promise<Challenge> {
  if (!supabase) throw new Error('offline')
  const { data, error } = await supabase.rpc('create_challenge', {
    p_name: name,
    p_goal: goal,
  })
  if (error) throw error
  const row = (Array.isArray(data) ? data[0] : data) as ChallengeRow
  return toChallenge(row)
}

export type JoinResult =
  | { ok: true; challenge: Challenge }
  | { ok: false; reason: 'not_found' | 'error' }

export async function joinChallenge(code: string): Promise<JoinResult> {
  if (!supabase) return { ok: false, reason: 'error' }
  const { data, error } = await supabase.rpc('join_challenge', {
    p_code: code.trim().toUpperCase(),
  })
  if (error) {
    return {
      ok: false,
      reason: error.message?.includes('CODE_NOT_FOUND') ? 'not_found' : 'error',
    }
  }
  const row = (Array.isArray(data) ? data[0] : data) as ChallengeRow
  return { ok: true, challenge: toChallenge(row) }
}

export async function updateChallenge(
  id: string,
  patch: { name?: string; weeklyGoal?: number },
): Promise<void> {
  if (!supabase) return
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.weeklyGoal !== undefined) row.weekly_goal = patch.weeklyGoal
  const { error } = await supabase.from('challenges').update(row).eq('id', id)
  if (error) throw error
}

// ---- Membros (ranking) -----------------------------------------------------

export async function loadMembers(challengeId: string): Promise<Member[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('members')
    .select('challenge_id, user_id, display_name, is_owner, state, updated_at')
    .eq('challenge_id', challengeId)
  if (error) throw error
  return ((data as MemberRow[]) ?? []).map(toMember)
}

/** Subscreve alterações a qualquer membro do desafio (ranking ao vivo). */
export function subscribeMembers(challengeId: string, cb: () => void): () => void {
  const client = supabase
  if (!client) return () => {}
  const channel = client
    .channel(`members:${challengeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'members',
        filter: `challenge_id=eq.${challengeId}`,
      },
      () => cb(),
    )
    .subscribe()
  return () => {
    client.removeChannel(channel)
  }
}

// ---- Estado do próprio participante ----------------------------------------

export async function loadMyState(
  challengeId: string,
  userId: string,
): Promise<SharedData | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('members')
    .select('state')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data?.state as SharedData) ?? {}
}

export async function saveMyState(
  challengeId: string,
  userId: string,
  data: SharedData,
  displayName?: string,
): Promise<void> {
  if (!supabase) return
  const row: Record<string, unknown> = {
    challenge_id: challengeId,
    user_id: userId,
    state: data,
    updated_at: new Date().toISOString(),
  }
  if (displayName !== undefined) row.display_name = displayName
  const { error } = await supabase
    .from('members')
    .upsert(row, { onConflict: 'challenge_id,user_id' })
  if (error) throw error
}

/** Subscreve alterações ao meu próprio estado (sincronização entre dispositivos). */
export function subscribeMyState(
  challengeId: string,
  userId: string,
  cb: (data: SharedData) => void,
): () => void {
  const client = supabase
  if (!client) return () => {}
  const channel = client
    .channel(`mystate:${challengeId}:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'members',
        filter: `challenge_id=eq.${challengeId}`,
      },
      (payload) => {
        const next = payload.new as MemberRow | null
        if (next && next.user_id === userId && next.state) cb(next.state)
      },
    )
    .subscribe()
  return () => {
    client.removeChannel(channel)
  }
}
