import type {
  ExerciseItem,
  ParseWarning,
  ParsedWeek,
  Reps,
  Weekday,
  WorkoutDay,
} from '@/types'
import { normalize } from '@/lib/text'

/** Formas base de cada dia (normalizadas) → dia canónico. Inclui o típico "segundo". */
const DAY_BASE: Record<string, Weekday> = {
  segunda: 'segunda',
  segundo: 'segunda',
  seg: 'segunda',
  '2a': 'segunda',
  terca: 'terca',
  ter: 'terca',
  '3a': 'terca',
  quarta: 'quarta',
  qua: 'quarta',
  '4a': 'quarta',
  quinta: 'quinta',
  qui: 'quinta',
  '5a': 'quinta',
  sexta: 'sexta',
  sex: 'sexta',
  '6a': 'sexta',
  sabado: 'sabado',
  sab: 'sabado',
  domingo: 'domingo',
  dom: 'domingo',
}

const REST_WORDS = ['descanso', 'folga', 'off', 'repouso']

// Nomes de dia por extenso, para separar dias colados.
const DAY_WORDS = 'segunda|segundo|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo'
// Com "-feira"/" feira" — marcador forte (separa mesmo colado a letras).
const DAY_FEIRA = new RegExp(`((?:${DAY_WORDS})[-\\s]*feira)`, 'giu')
// Sem "feira" — só quando precedido por início/não-letra (ex.: "core Sábado").
const DAY_PLAIN = new RegExp(`(^|[^\\p{L}\\n])((?:${DAY_WORDS})(?![-\\s]*feira))`, 'giu')
const DAY_HEADER = new RegExp(
  `^\\s*(${DAY_WORDS})(?:[-\\s]*feira)?\\s*[-:–—.]*\\s*(.*)$`,
  'i',
)

/**
 * Garante que cada dia começa numa linha própria, mesmo que no texto original
 * venham colados (ex.: "DescansoTerça-feira", "Z2Quarta feira-", "core Sábado").
 */
function insertDayBreaks(text: string): string {
  return text
    .replace(DAY_FEIRA, '\n$1')
    .replace(DAY_PLAIN, (_all, pre: string, tok: string) => `${pre}\n${tok}`)
}

/** Se a linha começa por um nome de dia, devolve o dia + o resto (título/conteúdo). */
function matchDayHeader(line: string): { day: Weekday; rest: string } | null {
  // Nomes por extenso (com "-feira"/" feira"), inclusive colados.
  const m = line.match(DAY_HEADER)
  if (m) {
    const day = DAY_BASE[normalize(m[1])]
    if (day) return { day, rest: m[2].trim() }
  }
  // Formas curtas (Seg, Ter, Qua…, 2a…): a primeira "palavra".
  const t = line.trim().match(/^([\w²³ªºçãáàâéêíóôõú]+)\s*(?:[-:–—.]\s*)?(.*)$/i)
  if (t) {
    const day = DAY_BASE[normalize(t[1])]
    if (day) return { day, rest: t[2].trim() }
  }
  return null
}

/** Interpreta o token de repetições depois do "x". */
function parseReps(token: string): Reps {
  const t = normalize(token)
  const time = t.match(/^(\d+)\s*(s|seg|segundos)$/)
  if (time) return { kind: 'time', seconds: Number(time[1]) }
  if (/^(falha|falhar|falhas|failure|max|maximo|maxima)$/.test(t)) {
    return { kind: 'failure' }
  }
  if (/^\d+$/.test(t)) return { kind: 'count', value: Number(t) }
  return { kind: 'free', text: token.trim() }
}

/** Extrai peso (ex. "60kg", "40 kg") de um fragmento e devolve peso + resto. */
function extractWeight(text: string): { weight: string | null; rest: string } {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i)
  if (!m) return { weight: null, rest: text.trim() }
  const weight = `${m[1].replace(',', '.')}kg`
  const rest = (text.slice(0, m.index) + text.slice(m.index! + m[0].length)).trim()
  return { weight, rest }
}

/** Limpa uma nota (remove separadores soltos nas pontas). */
function cleanNote(text: string): string | null {
  const n = text.replace(/^[\s,·:–-]+|[\s,·:–-]+$/g, '').trim()
  return n.length ? n : null
}

/** Interpreta um fragmento como exercício. */
function parseExercise(line: string): ExerciseItem {
  const raw = line.replace(/^[-–•*\s]+/, '').trim()

  // Padrão "SxR", ex. 4x8, 3 x 12, 4×10 (mas não dentro de parênteses complexos).
  const sxr = raw.match(/(\d+)\s*[x×]\s*([^\s,()]+)/i)
  if (sxr && !raw.slice(0, sxr.index).includes('(')) {
    const sets = Number(sxr[1])
    const reps = parseReps(sxr[2])
    const name = raw.slice(0, sxr.index).trim().replace(/[-–:·,]+$/, '').trim()
    const after = raw.slice(sxr.index! + sxr[0].length)
    const { weight, rest } = extractWeight(after)
    return { name: name || raw, sets, reps, weight, note: cleanNote(rest), raw }
  }

  // Duração/distância, ex. "Corrida 30min", "Prancha 40s", "5km".
  const dur = raw.match(/(\d+)\s*(min|minutos|s|seg|segundos|km|m)\b/i)
  if (dur && !raw.includes('+') && !raw.includes('(')) {
    const name = raw.slice(0, dur.index).trim().replace(/[-–:·,]+$/, '').trim()
    return {
      name: name || raw,
      sets: null,
      reps: { kind: 'free', text: dur[0].trim() },
      weight: null,
      note: cleanNote(raw.slice(dur.index! + dur[0].length)),
      raw,
    }
  }

  // Caso geral: descrição livre (mantém o texto como está).
  return { name: raw, sets: null, reps: null, weight: null, note: null, raw }
}

function isRestText(text: string): boolean {
  const n = normalize(text)
  return REST_WORDS.some((w) => n.includes(w))
}

function looksLikeExercise(line: string): boolean {
  return /[a-zçãáàâéêíóôõú0-9]/i.test(line)
}

/** Divide por "+" apenas no nível de topo (respeita parênteses, ex. 2x(a + b)). */
function splitTopLevelPlus(text: string): string[] {
  const parts: string[] = []
  let depth = 0
  let buf = ''
  for (const ch of text) {
    if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === '+' && depth === 0) {
      parts.push(buf)
      buf = ''
    } else buf += ch
  }
  parts.push(buf)
  return parts.map((s) => s.replace(/^[-–•*\s]+/, '').trim()).filter(Boolean)
}

/** Divide o conteúdo de um dia (texto livre) em itens legíveis. */
function splitContent(text: string): string[] {
  return text
    .split(/\r?\n/)
    .flatMap(splitTopLevelPlus)
    .filter(Boolean)
}

/**
 * Interpreta o texto colado num plano de semana estruturado, mesmo quando os
 * dias vêm colados e o conteúdo é texto livre.
 */
export function parseWorkouts(input: string): ParsedWeek {
  const days: WorkoutDay[] = []
  const warnings: ParseWarning[] = []
  // Guarda o conteúdo que veio na mesma linha do dia (para dias sem linhas próprias).
  const inline = new Map<WorkoutDay, string>()
  let current: WorkoutDay | null = null
  let seenDay = false

  const lines = insertDayBreaks(input).split(/\r?\n/)

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim()
    if (!line) return

    const header = matchDayHeader(line)
    if (header) {
      seenDay = true
      const rest = isRestText(header.rest) && splitContent(header.rest).length <= 1
      current = { day: header.day, title: rest ? null : header.rest || null, rest, exercises: [] }
      days.push(current)
      if (header.rest) inline.set(current, header.rest)
      return
    }

    // "descanso" solto dentro de um dia
    if (current && isRestText(line) && splitContent(line).length <= 1) {
      current.rest = true
      inline.delete(current)
      return
    }

    if (!current) {
      // Antes do primeiro dia e sem números → provável título do plano; ignora.
      if (!seenDay && !/\d/.test(line)) return
      warnings.push({
        line: i + 1,
        text: line,
        reason: 'Linha fora de um dia. Começa por indicar o dia (ex.: "Segunda - Pernas").',
      })
      return
    }

    if (!looksLikeExercise(line)) return
    current.exercises.push(parseExercise(line))
    inline.delete(current) // havia linhas próprias → o "resto" do cabeçalho era título
  })

  // Dias sem linhas próprias: usa o conteúdo que veio colado ao nome do dia.
  for (const day of days) {
    const raw = inline.get(day)
    if (!raw || day.rest || day.exercises.length > 0) continue
    const items = splitContent(raw)
    if (items.length === 0) continue
    day.exercises = items.map(parseExercise)
    day.title = null // era conteúdo, não título
  }

  return { days, warnings }
}

/** Descrição legível das repetições (para a UI). */
export function repsLabel(reps: Reps | null): string {
  if (!reps) return ''
  switch (reps.kind) {
    case 'count':
      return String(reps.value)
    case 'time':
      return `${reps.seconds}s`
    case 'failure':
      return 'falha'
    case 'free':
      return reps.text
  }
}

/** Descrição legível de séries×reps (para a UI). */
export function setsRepsLabel(item: ExerciseItem): string {
  const r = repsLabel(item.reps)
  if (item.sets && r) return `${item.sets}×${r}`
  if (item.sets) return `${item.sets} séries`
  if (r) return r
  return ''
}
