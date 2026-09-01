import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Role } from '@/types'
import { supabase, isDemoMode } from './supabase'

export interface Profile {
  id: string
  name: string
  role: Role
}

interface AuthValue {
  loading: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (
    email: string,
    password: string,
    name: string,
    role: Role,
  ) => Promise<string | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

async function loadProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('profiles')
    .select('id, name, role')
    .eq('id', userId)
    .maybeSingle()
  return (data as Profile | null) ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(!isDemoMode)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) setProfile(await loadProfile(data.session.user.id))
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s)
      setProfile(s ? await loadProfile(s.user.id) : null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      signIn: async (email, password) => {
        if (!supabase) return 'Backend indisponível.'
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return error ? traduzErro(error.message) : null
      },
      signUp: async (email, password, name, role) => {
        if (!supabase) return 'Backend indisponível.'
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        })
        if (error) return traduzErro(error.message)
        // define nome e papel no perfil (o trigger criou a linha base)
        if (data.user) {
          await supabase
            .from('profiles')
            .upsert({ id: data.user.id, name, role })
          if (data.session) setProfile(await loadProfile(data.user.id))
        }
        return null
      },
      signOut: async () => {
        await supabase?.auth.signOut()
        setProfile(null)
      },
      refreshProfile: async () => {
        if (session) setProfile(await loadProfile(session.user.id))
      },
    }),
    [loading, session, profile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function traduzErro(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Email ou palavra-passe incorretos.'
  if (m.includes('already registered')) return 'Já existe uma conta com este email.'
  if (m.includes('password')) return 'Palavra-passe demasiado curta (mín. 6 caracteres).'
  if (m.includes('email')) return 'Email inválido.'
  return msg
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
