"use client"

import { cn } from "@/lib/utils"

interface ProgressRingProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  className?: string
  variant?: "brand" | "energy" | "muscle" | "performance"
  showValue?: boolean
  label?: string
}

const variantColors = {
  brand: {
    track: "stroke-brand-100 dark:stroke-white/10",
    progress: "stroke-brand-500 dark:stroke-brand-400",
    text: "text-brand-700 dark:text-brand-300",
    gradient: ["#E85D04", "#FB8A3C"],
  },
  energy: {
    track: "stroke-energy-100 dark:stroke-white/10",
    progress: "stroke-energy-500 dark:stroke-energy-400",
    text: "text-energy-700 dark:text-energy-300",
    gradient: ["#F59E0B", "#FDBB7A"],
  },
  muscle: {
    track: "stroke-muscle-100 dark:stroke-white/10",
    progress: "stroke-muscle-500 dark:stroke-muscle-400",
    text: "text-muscle-700 dark:text-muscle-300",
    gradient: ["#EF4444", "#FB8A3C"],
  },
  performance: {
    track: "stroke-performance-100 dark:stroke-white/10",
    progress: "stroke-performance-500 dark:stroke-performance-400",
    text: "text-performance-700 dark:text-performance-300",
    gradient: ["#22C55E", "#4ADE80"],
  },
}

export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 6,
  className,
  variant = "brand",
  showValue = true,
  label,
}: ProgressRingProps) {
  const normalizedValue = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (normalizedValue / 100) * circumference
  const colors = variantColors[variant]
  const gradientId = `grad-${variant}-${size}`

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(normalizedValue)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.gradient[0]} />
            <stop offset="100%" stopColor={colors.gradient[1]} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("transition-colors", colors.track)}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={`url(#${gradientId})`}
          className="transition-all duration-700 ease-out"
          style={{
            filter: normalizedValue > 0 ? "drop-shadow(0 1px 3px rgba(232,93,4,0.3))" : undefined,
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "text-sm font-bold tabular-nums leading-none tracking-tight",
              colors.text
            )}
          >
            {Math.round(normalizedValue)}%
          </span>
          {label && (
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground leading-none mt-0.5">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function ProgressRingCard({
  value,
  label,
  sublabel,
  variant = "brand",
  size = 88,
}: {
  value: number
  label: string
  sublabel?: string
  variant?: ProgressRingProps["variant"]
  size?: number
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-4 shadow-soft transition-all hover:shadow-medium">
      <ProgressRing value={value} size={size} variant={variant} showValue />
      <div className="text-center">
        <p className="text-sm font-semibold leading-none">{label}</p>
        {sublabel && (
          <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
        )}
      </div>
    </div>
  )
}
