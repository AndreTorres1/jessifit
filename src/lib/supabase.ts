import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Cliente Supabase. É `null` quando as variáveis de ambiente não estão
 * definidas — nesse caso a app corre em MODO DEMO (dados de exemplo em
 * localStorage, sem backend). Ver README.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

export const isDemoMode = supabase === null
