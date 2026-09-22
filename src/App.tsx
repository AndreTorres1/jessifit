import { lazy, Suspense, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  CalendarDays,
  Home,
  Trophy,
  Users,
  LogOut,
  Loader2,
  Settings,
} from 'lucide-react'
import { useApp } from './data/store'
import { useAuth } from './lib/auth'
import { useChallenge } from './data/challenge'
import { isDemoMode } from './lib/supabase'
import { Logo, Wordmark } from './components/ui'
import { InstallHint } from './components/InstallHint'
import { ThemeToggle } from './components/ThemeToggle'
import { SettingsModal } from './components/SettingsModal'

// Code-splitting por rota: cada vista carrega só quando é necessária.
const LoginPage = lazy(() => import('./features/auth/LoginPage'))
const TodayPage = lazy(() => import('./features/athlete/TodayPage'))
const WeekPage = lazy(() => import('./features/athlete/WeekPage'))
const AthletesPage = lazy(() => import('./features/challenge/AthletesPage'))
const DesafioPage = lazy(() => import('./features/challenge/DesafioPage'))
const GroupPage = lazy(() => import('./features/challenge/GroupPage'))
const ImportPage = lazy(() => import('./features/coach/ImportPage'))
const LibraryPage = lazy(() => import('./features/coach/LibraryPage'))

const TABS = [
  { to: '/hoje', label: 'Hoje', icon: Home },
  { to: '/plano', label: 'Plano', icon: CalendarDays },
  { to: '/atletas', label: 'Atletas', icon: Users },
  { to: '/desafio', label: 'Desafio', icon: Trophy },
]

function Fallback() {
  return (
    <div className="grid place-items-center py-20 text-muted">
      <Loader2 className="animate-spin motion-reduce:animate-none" size={28} />
    </div>
  )
}

function TopBar() {
  const { saving, online } = useApp()
  const { myName } = useChallenge()
  const { signOut } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)
  return (
    <header className="safe-top sticky top-0 z-10 border-b border-line bg-ground/85 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-2.5 px-4 py-2.5">
        <Logo size={30} />
        <Wordmark className="text-base" />
        <span className="ml-auto flex items-center gap-1 text-xs text-muted">
          {online && saving && (
            <span className="mr-1 flex items-center gap-1 text-[0.7rem] text-muted">
              <Loader2 size={12} className="animate-spin" /> a guardar…
            </span>
          )}
          <span className="mr-1 max-w-[6rem] truncate font-[var(--font-mono)]">{myName}</span>
          <ThemeToggle />
          <button
            onClick={() => setSettingsOpen(true)}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
            aria-label="Definições"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => void signOut()}
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

function TabBar() {
  return (
    <nav className="safe-bottom sticky bottom-0 z-10 border-t border-line bg-ground/90 backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {TABS.map((t) => {
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

export default function App() {
  const { loading } = useApp()
  const auth = useAuth()
  const { athletes } = useChallenge()
  const location = useLocation()
  // Um treinador (tem atletas) entra pela gestão; caso contrário, pelo treino.
  const home = athletes.length > 0 ? '/atletas' : '/hoje'

  if (!isDemoMode) {
    if (auth.loading) return <Fallback />
    if (!auth.session) {
      return (
        <Suspense fallback={<Fallback />}>
          <LoginPage />
        </Suspense>
      )
    }
  }

  if (loading) return <Fallback />

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">
        <InstallHint />
        <div key={location.pathname} className="page-enter">
          <Suspense fallback={<Fallback />}>
            <Routes location={location}>
              <Route path="/hoje" element={<TodayPage />} />
              <Route path="/plano" element={<WeekPage />} />
              <Route path="/atletas" element={<AthletesPage />} />
              <Route path="/desafio" element={<DesafioPage />} />
              <Route path="/grupo" element={<GroupPage />} />
              <Route path="/importar" element={<ImportPage />} />
              <Route path="/biblioteca" element={<LibraryPage />} />
              <Route path="*" element={<Navigate to={home} replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
      <TabBar />
    </div>
  )
}
