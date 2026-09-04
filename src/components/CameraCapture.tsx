import { useCallback, useEffect, useRef, useState } from 'react'
import { X, RefreshCw, Zap, ZapOff, ImageUp } from 'lucide-react'

type Facing = 'environment' | 'user'

interface Props {
  onCapture: (file: File) => void
  onClose: () => void
}

/** Câmara própria (estilo BeReal): pré-visualização ao vivo, disparo, troca de
 * câmara e flash. Carimba data/hora na foto como prova de treino. */
export function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facing, setFacing] = useState<Facing>('environment')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [torch, setTorch] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(
    async (mode: Facing) => {
      stop()
      setReady(false)
      setError(null)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        })
        streamRef.current = stream
        const track = stream.getVideoTracks()[0]
        const caps = (track.getCapabilities?.() ?? {}) as { torch?: boolean }
        setHasTorch(Boolean(caps.torch))
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setReady(true)
      } catch {
        setError('Não foi possível aceder à câmara. Autoriza o acesso ou usa a galeria.')
      }
    },
    [stop],
  )

  useEffect(() => {
    start(facing)
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing])

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch }] as never })
      setTorch((t) => !t)
    } catch {
      /* sem suporte */
    }
  }

  const stampAndExport = (video: HTMLVideoElement): string => {
    const w = video.videoWidth || 720
    const h = video.videoHeight || 720
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    if (facing === 'user') {
      ctx.translate(w, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, w, h)
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // carimbo de data/hora (prova)
    const now = new Date()
    const stamp = now.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    const pad = Math.round(w * 0.03)
    const fs = Math.round(w * 0.038)
    ctx.font = `600 ${fs}px system-ui, sans-serif`
    ctx.textBaseline = 'bottom'
    const label = `JessiFit · ${stamp}`
    const tw = ctx.measureText(label).width
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(pad - 8, h - pad - fs - 10, tw + 16, fs + 16)
    ctx.fillStyle = '#fff'
    ctx.fillText(label, pad, h - pad)
    return canvas.toDataURL('image/jpeg', 0.85)
  }

  const shoot = () => {
    if (!videoRef.current || !ready) return
    setPreview(stampAndExport(videoRef.current))
    stop()
  }

  const usePhoto = () => {
    if (!preview) return
    const bin = atob(preview.split(',')[1])
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    onCapture(new File([bytes], 'prova.jpg', { type: 'image/jpeg' }))
  }

  const onFallbackFile = (f: File) => onCapture(f)

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black">
      {/* Topo */}
      <div className="safe-top flex items-center justify-between px-4 py-3 text-white">
        <button onClick={onClose} aria-label="Fechar" className="grid h-10 w-10 place-items-center">
          <X size={24} />
        </button>
        <span className="text-sm font-semibold">Prova de treino</span>
        <div className="h-10 w-10" />
      </div>

      {/* Área da câmara */}
      <div className="relative flex-1 overflow-hidden">
        {preview ? (
          <img src={preview} alt="Pré-visualização" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="h-full w-full object-cover"
            style={facing === 'user' ? { transform: 'scaleX(-1)' } : undefined}
          />
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 px-8 text-center text-white">
            <p className="text-sm">{error}</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold"
            >
              <ImageUp size={18} /> Escolher da galeria
            </button>
          </div>
        )}
      </div>

      {/* Controlos */}
      <div className="safe-bottom bg-black px-8 py-6 text-white">
        {preview ? (
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => {
                setPreview(null)
                start(facing)
              }}
              className="flex-1 rounded-xl bg-white/15 py-3 text-sm font-semibold"
            >
              Repetir
            </button>
            <button
              onClick={usePhoto}
              className="flex-1 rounded-xl py-3 text-sm font-semibold text-black"
              style={{ background: 'var(--accent-bright)' }}
            >
              Usar foto
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={toggleTorch}
              aria-label="Flash"
              className="grid h-12 w-12 place-items-center rounded-full"
              style={{ opacity: hasTorch ? 1 : 0.4 }}
              disabled={!hasTorch}
            >
              {torch ? <Zap size={24} /> : <ZapOff size={24} />}
            </button>

            <button
              onClick={shoot}
              disabled={!ready}
              aria-label="Tirar foto"
              className="grid h-20 w-20 place-items-center rounded-full border-4 border-white disabled:opacity-50"
            >
              <span className="h-16 w-16 rounded-full bg-white" />
            </button>

            <button
              onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
              aria-label="Trocar câmara"
              className="grid h-12 w-12 place-items-center rounded-full"
            >
              <RefreshCw size={24} />
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFallbackFile(f)
        }}
      />
    </div>
  )
}
