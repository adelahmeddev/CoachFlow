"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  alpha: number
  decay: number
  rotation: number
  vRot: number
}

const ATHLETIC_COLORS = [
  "#DE3B40", // Brand Crimson
  "#961112", // Deep Crimson
  "#F59E0B", // Energy Amber
  "#22C55E", // Performance Emerald
  "#EAB308", // Golden Gold
  "#38BDF8", // Sky Blue
]

export function CelebrationBurst({
  onComplete,
  duration = 2400,
}: {
  onComplete?: () => void
  duration?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    // Respect reduced motion: complete immediately with no visual explosion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      onComplete?.()
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    const w = (canvas.width = window.innerWidth)
    const h = (canvas.height = window.innerHeight)

    const count = Math.min(80, Math.floor(w / 16))
    const particles: Particle[] = []

    // Burst origin: bottom center / middle area
    const originX = w / 2
    const originY = h * 0.65

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
      const speed = 7 + Math.random() * 9
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4, // initial upward lift
        radius: 3 + Math.random() * 4,
        color: ATHLETIC_COLORS[Math.floor(Math.random() * ATHLETIC_COLORS.length)]!,
        alpha: 1,
        decay: 0.012 + Math.random() * 0.012,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2,
      })
    }

    const start = performance.now()

    const render = (now: number) => {
      const elapsed = now - start
      if (elapsed > duration) {
        ctx.clearRect(0, 0, w, h)
        onComplete?.()
        return
      }

      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.28 // gravity
        p.vx *= 0.985 // drag
        p.alpha = Math.max(0, p.alpha - p.decay)
        p.rotation += p.vRot

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color

        // Draw rectangular confetti flake
        ctx.fillRect(-p.radius, -p.radius / 2, p.radius * 2, p.radius)
        ctx.restore()
      }

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [duration, onComplete])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 size-full"
    />
  )
}
