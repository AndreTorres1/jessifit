import { describe, it, expect } from 'vitest'
import { parseWorkouts } from '@/engine/parseWorkouts'
import type { Completion } from '@/data/store'
import { countDone, trainingDays, weekProgress, weekGrid } from './stats'

const days = parseWorkouts(`Segunda - Pernas
Agachamento 4x8

Terça - descanso

Quarta - Peito
Supino 4x10

Sexta - Costas
Remada 3x12`).days

const completions: Record<string, Completion> = {
  segunda: { status: 'done' },
  quarta: { status: 'failed' },
}

describe('stats', () => {
  it('countDone conta apenas os feitos', () => {
    expect(countDone(completions)).toBe(1)
  })

  it('trainingDays ignora descanso', () => {
    expect(trainingDays(days)).toHaveLength(3) // seg, qua, sex
  })

  it('weekProgress conta feitos sobre total de dias de treino', () => {
    expect(weekProgress(days, completions)).toEqual({ done: 1, total: 3 })
  })

  it('weekGrid classifica cada dia da semana', () => {
    const grid = weekGrid(days, completions)
    const state = (d: string) => grid.find((g) => g.day === d)!.state
    expect(state('segunda')).toBe('done')
    expect(state('terca')).toBe('rest')
    expect(state('quarta')).toBe('failed')
    expect(state('quinta')).toBe('empty')
    expect(state('sexta')).toBe('pending')
  })
})
