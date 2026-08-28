import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { CalendarDays, Dumbbell, Home, Upload, LogOut } from 'lucide-react'
import { useApp } from './data/store'
import { Logo, Wordmark } from './components/ui'
import LoginPage from './features/auth/LoginPage'
import TodayPage from './features/athlete/TodayPage'
import WeekPage from './features/athlete/WeekPage'
import DashboardPage from './features/coach/DashboardPage'
import ImportPage from './features/coach/ImportPage'
import LibraryPage from './features/coach/LibraryPage'
import type { Role } from './types'

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

function TopBar() {
  const { role, setRole, plan } = useApp()
  return (
    <header className="safe-top sticky top-0 z-10 border-b border-line bg-ground/85 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-2.5 px-4 py-2.5">
        <Logo size={30} />
        <Wordmark className="text-base" />
        <span className="ml-auto flex items-center gap-2 text-xs text-muted">
          <span className="font-[var(--font-mono)]">
            {role === 'athlete' ? plan.athleteName : 'Treinador'}
          </span>
          <button
            onClick={() => setRole(null)}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
            aria-label="Trocar de perfil"
          >
            <LogOut size={16} />
          </button>
        </span>
      </div>
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

export default function App() {
  const { role } = useApp()
  const location = useLocation()

  if (!role) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }

  const home = role === 'athlete' ? '/hoje' : '/painel'

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">
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
      </main>
      <TabBar role={role} />
    </div>
  )
}
