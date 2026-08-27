import type {
  ExerciseItem,
  ParseWarning,
  ParsedWeek,
  Reps,
  Weekday,
  WorkoutDay,
} from '@/types'

/** Remove acentos e passa a minúsculas — para comparar palavras de forma tolerante. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Mapa de formas escritas → dia da semana canónico. */
const DAY_ALIASES: Record<string, Weekday> = {
  segunda: 'segunda',
  'segunda-feira': 'segunda',
  seg: 'segunda',
  '2a': 'segunda',
  terca: 'terca',
  'terca-feira': 'terca',
  ter: 'terca',
  '3a': 'terca',
  quarta: 'quarta',
  'quarta-feira': 'quarta',
  qua: 'quarta',
  '4a': 'quarta',
  quinta: 'quinta',
  'quinta-feira': 'quinta',
  qui: 'quinta',
  '5a': 'quinta',
  sexta: 'sexta',
  'sexta-feira': 'sexta',
  sex: 'sexta',
  '6a': 'sexta',
  sabado: 'sabado',
  sab: 'sabado',
  domingo: 'domingo',
  dom: 'domingo',
}

const REST_WORDS = ['descanso', 'folga', 'off', 'repouso']

/** Se a linha começa por um nome de dia, devolve o dia + o resto (título). */
function matchDayHeader(line: string): { day: Weekday; rest: string } | null {
  const trimmed = line.trim()
  // separa a primeira "palavra" (até -, :, espaço) do resto
  const m = trimmed.match(/^([\wçãáàâéêíóôõú-]+)\s*(?:[-:–]\s*)?(.*)$/i)
  if (!m) return null
  const first = normalize(m[1])
  const day = DAY_ALIASES[first]
  if (!day) return null
  return { day, rest: m[2].trim() }
}

/** Interpreta o token de repetições depois do "x". */
function parseReps(token: string): Reps {
  const t = normalize(token)
  // tempo: 30s, 45seg, 30segundos
  const time = t.match(/^(\d+)\s*(s|seg|segundos)$/)
  if (time) return { kind: 'time', seconds: Number(time[1]) }
  // até à falha
  if (/^(falha|falhar|falhas|failure|max|maximo|maxima)$/.test(t)) {
    return { kind: 'failure' }
  }
  // número simples
  if (/^\d+$/.test(t)) return { kind: 'count', value: Number(t) }
  // intervalo ou outra coisa (ex. 8-12) → texto livre
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

/** Interpreta uma linha de exercício. */
function parseExercise(line: string): ExerciseItem {
  const raw = line.trim()

  // Procura o padrão "SxR", ex. 4x8, 3 x 12, 4×10
  const sxr = raw.match(/(\d+)\s*[x×]\s*([^\s,]+)/i)

  if (sxr) {
    const sets = Number(sxr[1])
    const reps = parseReps(sxr[2])
    const name = raw.slice(0, sxr.index).trim().replace(/[-–:·,]+$/, '').trim()
    const after = raw.slice(sxr.index! + sxr[0].length)
    const { weight, rest } = extractWeight(after)
    return {
      name: name || raw,
      sets,
      reps,
      weight,
      note: cleanNote(rest),
      raw,
    }
  }

  // Sem SxR: pode ser exercício livre, ex. "Corrida 30min", "Prancha 40s".
  const dur = raw.match(/(\d+)\s*(min|minutos|s|seg|segundos|km|m)\b/i)
  if (dur) {
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

  // Caso geral: nome do exercício sem séries/reps.
  return { name: raw, sets: null, reps: null, weight: null, note: null, raw }
}

function isRestText(text: string): boolean {
  const n = normalize(text)
  return REST_WORDS.some((w) => n.includes(w))
}

/** Uma linha parece um exercício plausível (tem letras)? */
function looksLikeExercise(line: string): boolean {
  return /[a-zçãáàâéêíóôõú]/i.test(line)
}

/**
 * Interpreta o texto colado num plano de semana estruturado.
 * Nunca descarta informação: linhas que não encaixam vão para `warnings`.
 */
export function parseWorkouts(input: string): ParsedWeek {
  const days: WorkoutDay[] = []
  const warnings: ParseWarning[] = []
  let current: WorkoutDay | null = null

  const lines = input.split(/\r?\n/)

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim()
    if (!line) return // linha em branco = separador

    const header = matchDayHeader(line)
    if (header) {
      const rest = isRestText(header.rest)
      current = {
        day: header.day,
        title: rest ? null : header.rest || null,
        rest,
        exercises: [],
      }
      days.push(current)
      return
    }

    // linha "descanso" solta dentro de um dia
    if (current && isRestText(line) && !looksLikeExercise(line.replace(/descanso|folga|repouso|off/gi, ''))) {
      current.rest = true
      return
    }

    if (!current) {
      warnings.push({
        line: i + 1,
        text: line,
        reason: 'Linha fora de um dia. Começa por indicar o dia (ex.: "Segunda - Pernas").',
      })
      return
    }

    if (!looksLikeExercise(line)) {
      warnings.push({
        line: i + 1,
        text: line,
        reason: 'Não percebi esta linha como exercício.',
      })
      return
    }

    current.exercises.push(parseExercise(line))
  })

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
