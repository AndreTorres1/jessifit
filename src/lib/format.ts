import type { Weekday } from '@/types'
import { WEEKDAYS } from '@/types'

/** Dia da semana de hoje no formato do domínio (segunda…domingo). */
export function todayWeekday(): Weekday {
  // getDay(): 0 = domingo, 1 = segunda, …
  const js = new Date().getDay()
  const map: Weekday[] = [
    'domingo',
    'segunda',
    'terca',
    'quarta',
    'quinta',
    'sexta',
    'sabado',
  ]
  return map[js]
}

/** Ordena dias segundo a ordem natural da semana. */
export function sortByWeekday<T extends { day: Weekday }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day),
  )
}
