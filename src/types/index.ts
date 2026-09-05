// Tipos de domínio partilhados da JessiFit.

export type Role = 'coach' | 'athlete'

export type Weekday =
  | 'segunda'
  | 'terca'
  | 'quarta'
  | 'quinta'
  | 'sexta'
  | 'sabado'
  | 'domingo'

export const WEEKDAYS: Weekday[] = [
  'segunda',
  'terca',
  'quarta',
  'quinta',
  'sexta',
  'sabado',
  'domingo',
]

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  segunda: 'Segunda',
  terca: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  segunda: 'Seg',
  terca: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sáb',
  domingo: 'Dom',
}

/** Como as repetições foram escritas: número, tempo (segundos) ou "até à falha". */
export type Reps =
  | { kind: 'count'; value: number }
  | { kind: 'time'; seconds: number }
  | { kind: 'failure' }
  | { kind: 'free'; text: string }

export interface ExerciseItem {
  /** Nome do exercício, ex. "Agachamento". */
  name: string
  /** Número de séries, se indicado. */
  sets: number | null
  /** Repetições / duração / falha. */
  reps: Reps | null
  /** Peso alvo, ex. "60kg". */
  weight: string | null
  /** Nota livre extraída da linha, ex. "cada perna". */
  note: string | null
  /** Linha original, para referência/edição. */
  raw: string
}

/** Exercício na biblioteca reutilizável, com demonstração opcional. */
export interface Exercise {
  id: string
  name: string
  muscleGroup: string | null
  /** Link de vídeo (ex.: YouTube). */
  videoUrl: string | null
  /** Foto/GIF próprio: URL do Supabase Storage (online) ou data URL (demo). */
  imageUrl?: string | null
  /** @deprecated Compatibilidade: fotos antigas guardadas em base64. */
  imageDataUrl: string | null
  note: string | null
}

/** Registo de peso/reps feito num exercício, para acompanhar progressão. */
export interface ExerciseLog {
  id: string
  /** Chave normalizada do nome do exercício (liga entradas do mesmo exercício). */
  key: string
  name: string
  date: string // ISO
  weight?: string
  reps?: string
}

export type WorkoutStatus = 'done' | 'failed' | 'pending'

export interface WorkoutDay {
  day: Weekday
  /** Título do dia, ex. "Pernas". Null se não indicado. */
  title: string | null
  /** True se é um dia de descanso. */
  rest: boolean
  exercises: ExerciseItem[]
}

/** Linha que o parser não conseguiu interpretar — mostrada em aviso na pré-visualização. */
export interface ParseWarning {
  line: number
  text: string
  reason: string
}

export interface ParsedWeek {
  days: WorkoutDay[]
  warnings: ParseWarning[]
}
