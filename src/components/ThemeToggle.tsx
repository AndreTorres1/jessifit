import { useState } from 'react'
import { Sun, Moon, MonitorSmartphone } from 'lucide-react'
import { getTheme, setTheme, nextTheme, type Theme } from '@/lib/theme'

const ICON = {
  system: MonitorSmartphone,
  light: Sun,
  dark: Moon,
}

const LABEL: Record<Theme, string> = {
  system: 'Tema: automático',
  light: 'Tema: claro',
  dark: 'Tema: escuro',
}

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(() => getTheme())
  const Icon = ICON[theme]

  const cycle = () => {
    const next = nextTheme(theme)
    setTheme(next)
    setThemeState(next)
  }

  return (
    <button
      onClick={cycle}
      className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
      aria-label={LABEL[theme]}
      title={LABEL[theme]}
    >
      <Icon size={16} />
    </button>
  )
}
