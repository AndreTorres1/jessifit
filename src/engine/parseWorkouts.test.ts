import { describe, it, expect } from 'vitest'
import { parseWorkouts, setsRepsLabel } from './parseWorkouts'

describe('parseWorkouts', () => {
  it('interpreta um dia com título e exercícios', () => {
    const { days, warnings } = parseWorkouts(`Segunda - Pernas
Agachamento 4x8 60kg
Leg press 3x12`)
    expect(warnings).toHaveLength(0)
    expect(days).toHaveLength(1)
    expect(days[0].day).toBe('segunda')
    expect(days[0].title).toBe('Pernas')
    expect(days[0].rest).toBe(false)
    expect(days[0].exercises).toHaveLength(2)

    const [ag, leg] = days[0].exercises
    expect(ag.name).toBe('Agachamento')
    expect(ag.sets).toBe(4)
    expect(ag.reps).toEqual({ kind: 'count', value: 8 })
    expect(ag.weight).toBe('60kg')

    expect(leg.name).toBe('Leg press')
    expect(leg.sets).toBe(3)
    expect(leg.weight).toBeNull()
  })

  it('extrai notas soltas como "cada perna"', () => {
    const { days } = parseWorkouts(`Segunda\nAfundos 3x10 cada perna`)
    const ex = days[0].exercises[0]
    expect(ex.name).toBe('Afundos')
    expect(ex.sets).toBe(3)
    expect(ex.reps).toEqual({ kind: 'count', value: 10 })
    expect(ex.note).toBe('cada perna')
  })

  it('reconhece tempo, falha e peso decimal', () => {
    const { days } = parseWorkouts(`Terça - Core
Prancha 3x30s
Elevações 3x falha
Supino 4x10 62.5kg`)
    const [prancha, elev, supino] = days[0].exercises
    expect(prancha.reps).toEqual({ kind: 'time', seconds: 30 })
    expect(elev.reps).toEqual({ kind: 'failure' })
    expect(supino.weight).toBe('62.5kg')
  })

  it('interpreta exercícios livres como corrida 30min', () => {
    const { days } = parseWorkouts(`Sexta - Cardio\nCorrida 30min`)
    const ex = days[0].exercises[0]
    expect(ex.name).toBe('Corrida')
    expect(ex.sets).toBeNull()
    expect(ex.reps).toEqual({ kind: 'free', text: '30min' })
  })

  it('marca dias de descanso', () => {
    const { days } = parseWorkouts(`Domingo - descanso`)
    expect(days[0].rest).toBe(true)
    expect(days[0].title).toBeNull()
    expect(days[0].exercises).toHaveLength(0)
  })

  it('reconhece formas curtas e sem título', () => {
    const { days } = parseWorkouts(`Qua\nRemada 3x12`)
    expect(days[0].day).toBe('quarta')
    expect(days[0].title).toBeNull()
    expect(days[0].exercises).toHaveLength(1)
  })

  it('avisa sobre linhas fora de um dia, sem descartar', () => {
    const { warnings } = parseWorkouts(`Agachamento 4x8`)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].line).toBe(1)
    expect(warnings[0].text).toBe('Agachamento 4x8')
  })

  it('processa uma semana completa', () => {
    const { days, warnings } = parseWorkouts(`Segunda - Full body
Agachamento 4x8 50kg
Supino 3x10
Remada 3x12

Quarta - Core e cardio
Prancha 3x45s
Corrida 25min

Sábado - descanso`)
    expect(warnings).toHaveLength(0)
    expect(days).toHaveLength(3)
    expect(days[0].exercises).toHaveLength(3)
    expect(days[1].exercises).toHaveLength(2)
    expect(days[2].rest).toBe(true)
  })

  it('setsRepsLabel formata para a UI', () => {
    const { days } = parseWorkouts(`Segunda\nAgachamento 4x8`)
    expect(setsRepsLabel(days[0].exercises[0])).toBe('4×8')
  })
})
