import { supabase } from '@/lib/supabase'

const ROW_ID = 'main'

/** Fatia do estado da app que é partilhada entre os dois utilizadores. */
export interface SharedData {
  plan?: unknown
  completions?: unknown
  exercises?: unknown
  history?: unknown
  /** Marca de revisão para ignorar ecos das nossas próprias gravações. */
  _rev?: string
}

export async function loadShared(): Promise<SharedData | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('shared_state')
    .select('data')
    .eq('id', ROW_ID)
    .maybeSingle()
  if (error) throw error
  return (data?.data as SharedData) ?? {}
}

export async function saveShared(data: SharedData): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('shared_state')
    .upsert({ id: ROW_ID, data, updated_at: new Date().toISOString() })
  if (error) throw error
}

/** Subscreve alterações ao documento partilhado (tempo real). */
export function subscribeShared(cb: (data: SharedData) => void): () => void {
  const client = supabase
  if (!client) return () => {}
  const channel = client
    .channel('shared_state')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'shared_state', filter: `id=eq.${ROW_ID}` },
      (payload) => {
        const next = (payload.new as { data?: SharedData } | null)?.data
        if (next) cb(next)
      },
    )
    .subscribe()
  return () => {
    client.removeChannel(channel)
  }
}
