import { describe, it, expect } from 'vitest'
import {
  parseDuration,
  parseDistance,
  formatDuration,
  formatPace,
  paceSeconds,
  runProgress,
} from './run'
import type { RunLog } from '@/types'

describe('parseDuration', () => {
  it('lê mm:ss e h:mm:ss', () => {
    expect(parseDuration('42:28')).toBe(42 * 60 + 28)
    expect(parseDuration('1:02:56')).toBe(3600 + 2 * 60 + 56)
    expect(parseDuration('30min')).toBe(1800)
  })
  it('rejeita inválidos', () => {
    expect(parseDuration('abc')).toBeNull()
    expect(parseDuration('42:99')).toBeNull()
    expect(parseDuration('')).toBeNull()
  })
})

describe('parseDistance', () => {
  it('lê variações', () => {
    expect(parseDistance('10')).toBe(10)
    expect(parseDistance('10km')).toBe(10)
    expect(parseDistance('10,5 km')).toBe(10.5)
  })
  it('rejeita inválidos', () => {
    expect(parseDistance('0')).toBeNull()
    expect(parseDistance('abc')).toBeNull()
  })
})

describe('pace', () => {
  it('calcula e formata pace', () => {
    // André: 10km em 42:28 → pace 4:15/km (2548/10 = 254.8s ≈ 4:15)
    const p = paceSeconds({ distanceKm: 10, seconds: 2548 })
    expect(formatPace(p)).toBe('4:15')
    // Luana: 10km em 1:02:56 → 3776/10 = 377.6 ≈ 6:18
    expect(formatPace(paceSeconds({ distanceKm: 10, seconds: 3776 }))).toBe('6:18')
  })
  it('formata duração escondendo horas nulas', () => {
    expect(formatDuration(2548)).toBe('42:28')
    expect(formatDuration(3776)).toBe('1:02:56')
  })
})

describe('runProgress', () => {
  const runs: RunLog[] = [
    { id: 'a', date: '2026-08-24T00:00:00.000Z', distanceKm: 10, seconds: 3300 },
    { id: 'b', date: '2026-09-07T00:00:00.000Z', distanceKm: 10, seconds: 3090 },
  ]
  it('calcula melhoria de pace face à primeira corrida', () => {
    const p = runProgress(runs)
    expect(p.runs).toBe(2)
    expect(p.totalKm).toBe(20)
    // baseline 330s/km, best 309s/km → (330-309)/330 ≈ 6.36%
    expect(p.improvementPct).toBeCloseTo(6.36, 1)
    expect(p.best?.id).toBe('b')
  })
  it('lida com lista vazia', () => {
    expect(runProgress([]).runs).toBe(0)
    expect(runProgress(undefined).improvementPct).toBe(0)
  })
})
