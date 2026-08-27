import type { WeekPlan } from './store'
import { parseWorkouts } from '@/engine/parseWorkouts'

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
