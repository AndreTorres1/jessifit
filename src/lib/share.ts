import type { WorkoutDay } from '@/types'
import { WEEKDAY_LABEL } from '@/types'
import { setsRepsLabel } from '@/engine/parseWorkouts'
import { sortByWeekday } from '@/lib/format'

/** Constrói uma mensagem de texto legível com o plano da semana. */
export function buildWeekMessage(
  athleteName: string,
  weekNumber: number,
  days: WorkoutDay[],
): string {
  const lines: string[] = [`🌿 JessiFit — Semana ${weekNumber} · ${athleteName}`, '']
  for (const d of sortByWeekday(days)) {
    if (d.rest) {
      lines.push(`${WEEKDAY_LABEL[d.day]} — descanso`)
      continue
    }
    lines.push(`${WEEKDAY_LABEL[d.day]}${d.title ? ` · ${d.title}` : ''}`)
    for (const ex of d.exercises) {
      const sr = setsRepsLabel(ex)
      const extras = [sr, ex.weight, ex.note].filter(Boolean).join(' · ')
      lines.push(`• ${ex.name}${extras ? ` — ${extras}` : ''}`)
    }
    lines.push('')
  }
  return lines.join('\n').trim()
}

export type ShareResult = 'shared' | 'whatsapp' | 'copied' | 'failed'

/**
 * Partilha o texto: usa a Web Share API (nativo no telemóvel); se não existir,
 * abre o WhatsApp; em último caso, copia para a área de transferência.
 */
export async function shareText(text: string): Promise<ShareResult> {
  if (navigator.share) {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch {
      return 'failed' // utilizador cancelou
    }
  }
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`
  const win = window.open(wa, '_blank', 'noopener,noreferrer')
  if (win) return 'whatsapp'
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
