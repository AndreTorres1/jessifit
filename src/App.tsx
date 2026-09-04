import { lazy, Suspense, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  CalendarDays,
  Dumbbell,
  Home,
  Upload,
  LogOut,
  Loader2,
  Settings,
} from 'lucide-react'
import { useApp } from './data/store'
import { useAuth } from './lib/auth'
import { Logo, Wordmark } from './components/ui'
import { InstallHint } from './components/InstallHint'
import { ThemeToggle } from './components/ThemeToggle'
import { SettingsModal } from './components/SettingsModal'
import type { Role } from './types'

// Code-splitting por rota: cada vista carrega só quando é necessária.
const LoginPage = lazy(() => import('./features/auth/LoginPage'))
const TodayPage = lazy(() => import('./features/athlete/TodayPage'))
const WeekPage = lazy(() => import('./features/athlete/WeekPage'))
const DashboardPage = lazy(() => import('./features/coach/DashboardPage'))
const ImportPage = lazy(() => import('./features/coach/ImportPage'))
const LibraryPage = lazy(() => import('./features/coach/LibraryPage'))

interface Tab {
  to: string
  label: string
  icon: typeof Home
}

const TABS: Record<Exclude<Role, never>, Tab[]> = {
  athlete: [
    { to: '/hoje', label: 'Hoje', icon: Home },
    { to: '/semana', label: 'Semana', icon: CalendarDays },
  ],
  coach: [
    { to: '/painel', label: 'Painel', icon: Home },
    { to: '/importar', label: 'Importar', icon: Upload },
    { to: '/biblioteca', label: 'Biblioteca', icon: Dumbbell },
  ],
}

function Fallback() {
  return (
    <div className="grid place-items-center py-20 text-muted">
      <Loader2 className="animate-spin motion-reduce:animate-none" size={28} />
    </div>
  )
}

function TopBar() {
  const { role, setRole, plan } = useApp()
  const { signOut } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const logout = () => {
    setRole(null)
    void signOut()
  }
  return (
    <header className="safe-top sticky top-0 z-10 border-b border-line bg-ground/85 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-2.5 px-4 py-2.5">
        <Logo size={30} />
        <Wordmark className="text-base" />
        <span className="ml-auto flex items-center gap-1 text-xs text-muted">
          <span className="mr-1 font-[var(--font-mono)]">
            {role === 'athlete' ? plan.athleteName : 'Treinador'}
          </span>
          <ThemeToggle />
          {role === 'coach' && (
            <button
              onClick={() => setSettingsOpen(true)}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
              aria-label="Definições"
            >
              <Settings size={16} />
            </button>
          )}
          <button
            onClick={logout}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
            aria-label="Sair"
          >
            <LogOut size={16} />
          </button>
        </span>
      </div>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </header>
  )
}

function TabBar({ role }: { role: Role }) {
  return (
    <nav className="safe-bottom sticky bottom-0 z-10 border-t border-line bg-ground/90 backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {TABS[role].map((t) => {
          const Icon = t.icon
          return (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.7rem] font-medium transition ${
                  isActive ? 'text-accent-deep' : 'text-muted'
                }`
              }
            >
              <Icon size={20} />
              {t.label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

function Restricted() {
  const { signOut } = useAuth()
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo size={56} />
      <div>
        <h1 className="font-[var(--font-display)] text-xl font-bold">Acesso restrito</h1>
        <p className="mt-1 text-sm text-muted">
          Esta JessiFit é privada e já tem os seus dois utilizadores. Fala com o
          treinador se achas que devias ter acesso.
        </p>
      </div>
      <button
        onClick={() => void signOut()}
        className="rounded-xl px-4 py-3 text-sm font-semibold text-white"
        style={{
          background: 'linear-gradient(150deg, var(--accent-bright), var(--accent-deep))',
        }}
      >
        Sair
      </button>
    </div>
  )
}

export default function App() {
  const { role, loading, accessDenied } = useApp()
  const location = useLocation()

  if (loading) return <Fallback />

  if (accessDenied) return <Restricted />

  if (!role) {
    return (
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Suspense>
    )
  }

  const home = role === 'athlete' ? '/hoje' : '/painel'

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">
        <InstallHint />
        <div key={location.pathname} className="page-enter">
          <Suspense fallback={<Fallback />}>
            <Routes location={location}>
              {role === 'athlete' ? (
                <>
                  <Route path="/hoje" element={<TodayPage />} />
                  <Route path="/semana" element={<WeekPage />} />
                </>
              ) : (
                <>
                  <Route path="/painel" element={<DashboardPage />} />
                  <Route path="/importar" element={<ImportPage />} />
                  <Route path="/biblioteca" element={<LibraryPage />} />
                </>
              )}
              <Route path="*" element={<Navigate to={home} replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
      <TabBar role={role} />
    </div>
  )
}
