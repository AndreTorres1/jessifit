import { supabase } from './supabase'

/**
 * Lê um ficheiro de imagem e devolve um data URL redimensionado (máx. `maxW` px
 * de largura) e comprimido em JPEG.
 */
export function fileToScaledDataUrl(file: File, maxW = 900, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Imagem inválida.'))
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas indisponível.'))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(',')
  const mime = head.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/**
 * Redimensiona a imagem e faz upload para um bucket do Supabase Storage,
 * devolvendo o URL público. Em modo demo (sem Supabase), devolve um data URL.
 */
export async function uploadImage(
  bucket: string,
  file: File,
  maxW = 1000,
  quality = 0.82,
): Promise<string> {
  const dataUrl = await fileToScaledDataUrl(file, maxW, quality)
  if (!supabase) return dataUrl // demo → base64
  const blob = dataUrlToBlob(dataUrl)
  const path = `${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) throw new Error('Falha no upload da imagem.')
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
