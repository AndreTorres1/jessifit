import { readString, writeString } from './storage'

export type Theme = 'system' | 'light' | 'dark'

const KEY = 'jessifit:theme'
const ORDER: Theme[] = ['system', 'light', 'dark']

export function getTheme(): Theme {
  const v = readString(KEY)
  return v === 'light' || v === 'dark' ? v : 'system'
}

/** Aplica o tema à raiz do documento (data-theme; ausente = segue o sistema). */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

export function setTheme(theme: Theme): void {
  writeString(KEY, theme)
  applyTheme(theme)
}

export function nextTheme(current: Theme): Theme {
  return ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]
}
