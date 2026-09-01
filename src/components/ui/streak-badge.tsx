"use client"

import { Flame, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreakBadgeProps {
  streak: number
  size?: "sm" | "md" | "lg"
  variant?: "flame" | "compact"
  className?: string
  animate?: boolean
}

const sizeMap = {
  sm: {
    wrapper: "h-6 px-2 gap-1 text-xs",
    icon: "size-3",
    text: "text-xs",
  },
  md: {
    wrapper: "h-7 px-2.5 gap-1.5 text-sm",
    icon: "size-3.5",
    text: "text-sm",
  },
  lg: {
    wrapper: "h-8 px-3 gap-1.5 text-base",
    icon: "size-4",
    text: "text-sm font-bold",
  },
}

export function StreakBadge({
  streak,
  size = "md",
  variant = "flame",
  className,
  animate = true,
}: StreakBadgeProps) {
  if (streak <= 0) return null

  const sizes = sizeMap[size]

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-energy-500 to-brand-500 text-white font-bold shadow-soft ring-1 ring-white/20",
          sizes.wrapper,
          animate && streak >= 3 && "animate-pulse-glow",
          className
        )}
      >
        <Flame className={cn(sizes.icon, animate && "animate-flame")} aria-hidden="true" />
        <span className={sizes.text}>{streak}</span>
      </span>
    )
  }

  // flame variant - sticker style
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-gradient-to-r from-energy-500 via-brand-500 to-energy-600 text-white font-bold shadow-soft ring-1 ring-brand-600/20",
        sizes.wrapper,
        animate && streak >= 7 && "animate-pulse-glow",
        className
      )}
      title={`${streak} يوم متتالي`}
    >
      <span className="relative flex items-center">
        <Flame
          className={cn(sizes.icon, "fill-white/20", animate && streak >= 3 && "animate-flame")}
          aria-hidden="true"
        />
        {streak >= 7 && (
          <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-white animate-pulse" />
        )}
      </span>
      <span className={cn("tabular-nums", sizes.text)}>
        {streak}
        <span className="ms-0.5 text-[10px] font-medium opacity-90 hidden sm:inline">
          يوم
        </span>
      </span>
    </span>
  )
}

export function StreakFlame({
  streak,
  className,
  showLabel = true,
}: {
  streak: number
  className?: string
  showLabel?: boolean
}) {
  if (streak <= 0) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-muted-foreground", className)}>
        <Flame className="size-4 opacity-40" />
        {showLabel && <span className="text-xs">ابدأ سلسلتك</span>}
      </span>
    )
  }

  const intensity = streak >= 30 ? "legendary" : streak >= 14 ? "hot" : streak >= 7 ? "warm" : "start"
  const intensityConfig = {
    legendary: {
      bg: "from-muscle-600 via-energy-500 to-brand-500",
      glow: "shadow-[0_0_20px_-4px_#F59E0B80,0_0_40px_-8px_#E85D0460]",
      icon: "text-white fill-white",
    },
    hot: {
      bg: "from-brand-500 to-energy-500",
      glow: "shadow-[0_0_16px_-4px_#E85D0460]",
      icon: "text-white fill-white/20",
    },
    warm: {
      bg: "from-brand-500 to-brand-400",
      glow: "shadow-soft",
      icon: "text-white fill-white/20",
    },
    start: {
      bg: "from-brand-400 to-brand-500",
      glow: "shadow-soft",
      icon: "text-white",
    },
  }[intensity]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-2.5 py-1 text-white font-bold ring-1 ring-white/20 transition-all",
        intensityConfig.bg,
        intensityConfig.glow,
        streak >= 7 && "animate-pulse-glow",
        className
      )}
    >
      <Flame className={cn("size-4", intensityConfig.icon, streak >= 3 && "animate-flame")} />
      <span className="tabular-nums text-sm">{streak}</span>
      {showLabel && <span className="text-xs font-medium opacity-90">يوم</span>}
      {streak >= 30 && <Zap className="size-3 fill-white text-white ms-0.5" />}
    </span>
  )
}
