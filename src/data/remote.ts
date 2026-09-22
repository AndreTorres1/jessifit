import { supabase } from '@/lib/supabase'

/** Estado de treino de um participante (plano, marcações, exercícios, etc.). */
export interface SharedData {
  plan?: unknown
  completions?: unknown
  exercises?: unknown
  history?: unknown
  logs?: unknown
  runs?: unknown
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
  /** Datas opcionais de início e fim (YYYY-MM-DD). */
  startsOn?: string | null
  endsOn?: string | null
}

/** Um participante do desafio + o seu estado de treino. */
export interface Member {
  userId: string
  displayName: string
  isOwner: boolean
  state: SharedData
  updatedAt: string
}

/** Um atleta que treino (relação treinador→atleta). */
export interface Athlete {
  userId: string
  name: string
}

interface ChallengeRow {
  id: string
  code: string
  name: string
  weekly_goal: number
  owner_id: string
  created_at: string
  starts_on?: string | null
  ends_on?: string | null
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
    startsOn: r.starts_on ?? null,
    endsOn: r.ends_on ?? null,
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
  patch: { name?: string; weeklyGoal?: number; startsOn?: string | null; endsOn?: string | null },
): Promise<void> {
  if (!supabase) return
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.weeklyGoal !== undefined) row.weekly_goal = patch.weeklyGoal
  if (patch.startsOn !== undefined) row.starts_on = patch.startsOn
  if (patch.endsOn !== undefined) row.ends_on = patch.endsOn
  const { error } = await supabase.from('challenges').update(row).eq('id', id)
  if (error) throw error
}

/** Remove um participante do desafio (só o organizador). */
export async function removeMember(challengeId: string, userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.rpc('remove_member', {
    p_challenge: challengeId,
    p_user: userId,
  })
  if (error) throw error
}

/** Define o plano de treino de um participante (só o organizador). */
export async function setMemberPlan(
  challengeId: string,
  userId: string,
  plan: unknown,
): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.rpc('set_member_plan', {
    p_challenge: challengeId,
    p_user: userId,
    p_plan: plan,
  })
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

// ---- Estado de treino por utilizador (independente de desafios) ------------

export async function loadUserState(userId: string): Promise<SharedData | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_state')
    .select('state')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data?.state as SharedData) ?? {}
}

export async function saveUserState(userId: string, data: SharedData): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('user_state')
    .upsert(
      { user_id: userId, state: data, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
  if (error) throw error
}

export function subscribeUserState(
  userId: string,
  cb: (data: SharedData) => void,
): () => void {
  const client = supabase
  if (!client) return () => {}
  const channel = client
    .channel(`userstate:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'user_state', filter: `user_id=eq.${userId}` },
      (payload) => {
        const next = (payload.new as { state?: SharedData } | null)?.state
        if (next) cb(next)
      },
    )
    .subscribe()
  return () => {
    client.removeChannel(channel)
  }
}

/** Subscreve qualquer alteração a estados de treino (para atualizar o ranking). */
export function subscribeUserStatesChanges(cb: () => void): () => void {
  const client = supabase
  if (!client) return () => {}
  const channel = client
    .channel('userstates-all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_state' }, () => cb())
    .subscribe()
  return () => {
    client.removeChannel(channel)
  }
}

/** Carrega os estados de vários utilizadores (para o ranking). */
export async function loadUserStates(userIds: string[]): Promise<Record<string, SharedData>> {
  if (!supabase || userIds.length === 0) return {}
  const { data, error } = await supabase
    .from('user_state')
    .select('user_id, state')
    .in('user_id', userIds)
  if (error) throw error
  const map: Record<string, SharedData> = {}
  for (const row of (data as { user_id: string; state: SharedData }[]) ?? []) {
    map[row.user_id] = row.state ?? {}
  }
  return map
}

// ---- Treinador → atletas ---------------------------------------------------

export async function myAthletes(): Promise<Athlete[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('my_athletes')
  if (error) throw error
  return ((data as { athlete_id: string; athlete_name: string }[]) ?? []).map((r) => ({
    userId: r.athlete_id,
    name: r.athlete_name,
  }))
}

export type AddAthleteResult =
  | { ok: true; athlete: Athlete }
  | { ok: false; reason: 'not_found' | 'self' | 'error' }

export async function addAthleteByEmail(email: string): Promise<AddAthleteResult> {
  if (!supabase) return { ok: false, reason: 'error' }
  const { data, error } = await supabase.rpc('add_athlete_by_email', { p_email: email.trim() })
  if (error) {
    if (error.message?.includes('USER_NOT_FOUND')) return { ok: false, reason: 'not_found' }
    if (error.message?.includes('CANNOT_ADD_SELF')) return { ok: false, reason: 'self' }
    return { ok: false, reason: 'error' }
  }
  const row = (Array.isArray(data) ? data[0] : data) as { athlete_id: string; athlete_name: string }
  return { ok: true, athlete: { userId: row.athlete_id, name: row.athlete_name } }
}

export async function setAthletePlan(
  athleteId: string,
  plan: unknown,
  exercises?: unknown,
): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.rpc('set_athlete_plan', {
    p_athlete: athleteId,
    p_plan: plan,
    p_exercises: exercises ?? null,
  })
  if (error) throw error
}

/** Pede ao servidor para enviar notificação push a um atleta (novo plano). */
export async function notifyAthletePlan(athleteId: string): Promise<void> {
  if (!supabase) return
  try {
    await supabase.functions.invoke('notify-plan', { body: { athleteId } })
  } catch {
    /* best-effort */
  }
}

// ---- Subscrições push ------------------------------------------------------

interface PushSubJSON {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
}

export async function savePushSubscription(userId: string, sub: PushSubJSON): Promise<void> {
  if (!supabase || !sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: sub.endpoint,
      user_id: userId,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  if (!supabase) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
}
