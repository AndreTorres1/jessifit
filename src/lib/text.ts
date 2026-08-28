/** Remove acentos e passa a minúsculas — para comparar palavras de forma tolerante. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Chave de correspondência para ligar exercícios do texto à biblioteca. */
export function matchKey(name: string): string {
  return normalize(name).replace(/\s+/g, ' ')
}

/** Extrai o ID de um vídeo do YouTube a partir de vários formatos de URL. */
export function youtubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

/** URL de pesquisa de demonstração (fallback quando não há vídeo próprio). */
export function demoSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    'como fazer ' + name + ' exercício',
  )}`
}
