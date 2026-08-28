import type { Exercise } from '@/types'
import type { WeekPlan } from './store'
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
  athleteName: 'Jessi',
  rawText: DEMO_TEXT,
  days: parseWorkouts(DEMO_TEXT).days,
}
