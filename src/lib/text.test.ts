import { describe, it, expect } from 'vitest'
import { normalize, matchKey, youtubeId, demoSearchUrl } from './text'

describe('normalize', () => {
  it('remove acentos e passa a minúsculas', () => {
    expect(normalize('Agachamento')).toBe('agachamento')
    expect(normalize('Tríceps')).toBe('triceps')
    expect(normalize('  Peso Morto ')).toBe('peso morto')
  })
})

describe('matchKey', () => {
  it('normaliza espaços para ligar exercícios', () => {
    expect(matchKey('Leg   Press')).toBe('leg press')
    expect(matchKey('Supíno')).toBe(matchKey('supino'))
  })
})

describe('youtubeId', () => {
  it('extrai o id de vários formatos', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=aclHkVaku9U')).toBe('aclHkVaku9U')
    expect(youtubeId('https://youtu.be/aclHkVaku9U')).toBe('aclHkVaku9U')
    expect(youtubeId('https://www.youtube.com/embed/aclHkVaku9U')).toBe('aclHkVaku9U')
    expect(youtubeId('https://youtube.com/shorts/aclHkVaku9U')).toBe('aclHkVaku9U')
    expect(youtubeId('https://www.youtube.com/watch?list=x&v=aclHkVaku9U')).toBe(
      'aclHkVaku9U',
    )
  })
  it('devolve null para urls inválidos', () => {
    expect(youtubeId('')).toBeNull()
    expect(youtubeId('https://example.com/video')).toBeNull()
  })
})

describe('demoSearchUrl', () => {
  it('gera url de pesquisa com o nome codificado', () => {
    const url = demoSearchUrl('Peso morto')
    expect(url).toContain('youtube.com/results')
    expect(url).toContain(encodeURIComponent('Peso morto'))
  })
})
