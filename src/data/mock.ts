import type { Exercise } from '@/types'
import type { WeekPlan } from './store'
import type { Challenge, Member } from './remote'
import { parseWorkouts } from '@/engine/parseWorkouts'

/** Alguns exercícios da biblioteca já com demonstração, para o modo demo. */
export const demoExercises: Exercise[] = [
  {
    id: 'ex-agachamento',
    name: 'Agachamento',
    muscleGroup: 'Pernas',
    videoUrl: 'https://www.youtube.com/watch?v=aclHkVaku9U',
    imageDataUrl: null,
    note: 'Costas direitas, joelhos alinhados com os pés.',
  },
  {
    id: 'ex-supino',
    name: 'Supino',
    muscleGroup: 'Peito',
    videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    imageDataUrl: null,
    note: null,
  },
  {
    id: 'ex-peso-morto',
    name: 'Peso morto',
    muscleGroup: 'Costas',
    videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
    imageDataUrl: null,
    note: 'Mantém a barra junto ao corpo.',
  },
  {
    id: 'ex-prancha',
    name: 'Prancha',
    muscleGroup: 'Core',
    videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
    imageDataUrl: null,
    note: null,
  },
]

const DEMO_TEXT = `Segunda - Pernas
Agachamento 4x8 60kg
Leg press 3x12
Afundos 3x10 cada perna
Gémeos 4x15

Terça - descanso

Quarta - Peito e tríceps
Supino 4x10
Elevações 3x falha
Tríceps corda 3x12
Prancha 3x45s

Quinta - descanso

Sexta - Costas e bíceps
Peso morto 4x6 50kg
Remada 3x12
Puxada 3x10
Rosca bíceps 3x12

Sábado - Cardio
Corrida 30min

Domingo - descanso`

export const demoWeek: WeekPlan = {
  weekNumber: 3,
  athleteName: 'Eu',
  rawText: DEMO_TEXT,
  days: parseWorkouts(DEMO_TEXT).days,
}

// ---- Desafio de demonstração (ranking) -------------------------------------

export const demoChallenge: Challenge = {
  id: 'demo-challenge',
  code: 'DEMO25',
  name: 'Desafio do Escritório',
  weeklyGoal: 4,
  ownerId: 'demo-me',
  createdAt: '2026-09-01T00:00:00.000Z',
  startsOn: '2026-09-01',
  endsOn: '2026-09-30',
}

const now = new Date().toISOString()

/** Participantes fictícios com progresso variado para preencher o ranking. */
export const demoMembers: Member[] = [
  {
    userId: 'demo-me',
    displayName: 'Eu',
    isOwner: true,
    updatedAt: now,
    state: {
      completions: {
        segunda: { status: 'done', difficulty: 4, markedAt: now },
        quarta: { status: 'done', difficulty: 3, markedAt: now },
        sexta: { status: 'done', difficulty: 5, markedAt: now },
      },
      history: [
        { weekNumber: 2, done: 4, total: 4, endedAt: '2026-09-07T00:00:00.000Z', points: 17 },
        { weekNumber: 1, done: 3, total: 4, endedAt: '2026-08-31T00:00:00.000Z', points: 9 },
      ],
      runs: [
        { id: 'e1', date: '2026-08-24T09:00:00.000Z', distanceKm: 10, seconds: 3300, source: 'strava' },
        { id: 'e2', date: '2026-09-07T09:00:00.000Z', distanceKm: 10, seconds: 3090, source: 'strava' },
      ],
    },
  },
  {
    userId: 'demo-rui',
    displayName: 'Rui',
    isOwner: false,
    updatedAt: now,
    state: {
      completions: {
        segunda: { status: 'done', difficulty: 5, markedAt: now },
        terca: { status: 'done', difficulty: 4, markedAt: now },
        quarta: { status: 'done', difficulty: 4, markedAt: now },
        quinta: { status: 'done', difficulty: 3, markedAt: now },
      },
      history: [
        { weekNumber: 2, done: 4, total: 4, endedAt: '2026-09-07T00:00:00.000Z', points: 21 },
        { weekNumber: 1, done: 4, total: 4, endedAt: '2026-08-31T00:00:00.000Z', points: 18 },
      ],
      runs: [
        { id: 'r1', date: '2026-08-24T09:00:00.000Z', distanceKm: 8, seconds: 2640, source: 'garmin' },
        { id: 'r2', date: '2026-09-07T09:00:00.000Z', distanceKm: 8, seconds: 2400, source: 'garmin' },
      ],
    },
  },
  {
    userId: 'demo-marta',
    displayName: 'Marta',
    isOwner: false,
    updatedAt: now,
    state: {
      completions: {
        terca: { status: 'done', difficulty: 3, markedAt: now },
        quinta: { status: 'done', difficulty: 4, markedAt: now },
      },
      history: [
        { weekNumber: 2, done: 3, total: 4, endedAt: '2026-09-07T00:00:00.000Z', points: 10 },
      ],
      runs: [
        { id: 'm1', date: '2026-08-24T09:00:00.000Z', distanceKm: 10, seconds: 2620, source: 'strava' },
        { id: 'm2', date: '2026-09-07T09:00:00.000Z', distanceKm: 10, seconds: 2548, source: 'strava' },
      ],
    },
  },
  {
    userId: 'demo-tiago',
    displayName: 'Tiago',
    isOwner: false,
    updatedAt: now,
    state: {
      completions: {
        segunda: { status: 'done', difficulty: 2, markedAt: now },
      },
      history: [],
      runs: [
        { id: 't1', date: '2026-08-24T09:00:00.000Z', distanceKm: 10, seconds: 3900, source: 'strava' },
        { id: 't2', date: '2026-09-07T09:00:00.000Z', distanceKm: 10, seconds: 3776, source: 'strava' },
      ],
    },
  },
]
