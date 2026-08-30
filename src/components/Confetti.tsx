import { useEffect, useRef } from 'react'

interface Piece {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vrot: number
  size: number
  color: string
}

const COLORS = ['#16a34a', '#1fb254', '#7ee6ac', '#b8730a', '#0d7a3b']

/** Explosão breve de confetti em canvas. Não faz nada se o utilizador pedir menos movimento. */
export function Confetti({ duration = 1600 }: { duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = (canvas.width = canvas.offsetWidth * dpr)
    const h = (canvas.height = canvas.offsetHeight * dpr)

    const pieces: Piece[] = Array.from({ length: 90 }, () => ({
      x: w / 2,
      y: h * 0.3,
      vx: (Math.random() - 0.5) * 14 * dpr,
      vy: (Math.random() - 0.9) * 14 * dpr,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      size: (4 + Math.random() * 5) * dpr,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }))

    const start = performance.now()
    let raf = 0
    const gravity = 0.35 * dpr

    const tick = (t: number) => {
      const elapsed = t - start
      ctx.clearRect(0, 0, w, h)
      for (const p of pieces) {
        p.vy += gravity
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vrot
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = Math.max(0, 1 - elapsed / duration)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()
      }
      if (elapsed < duration) raf = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, w, h)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration])

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  )
}
