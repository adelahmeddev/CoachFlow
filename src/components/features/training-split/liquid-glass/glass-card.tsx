"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { GlassSheen } from "./glass-sheen"
import type { TrainingDayFocus } from "@/lib/db/enums"

export type GlassGlowVariant =
  | "UPPER"
  | "LOWER"
  | "FULL_BODY"
  | "PUSH"
  | "PULL"
  | "LEGS"
  | "SHOULDERS_ARMS"
  | "CARDIO"
  | "MOBILITY"
  | "CUSTOM"
  | "REST"
  | "neutral"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassGlowVariant | TrainingDayFocus | string
  interactive?: boolean
  showSheen?: boolean
  children: React.ReactNode
}

const GLOW_VARIANTS: Record<string, { radial: string; borderHover: string; pill: string }> = {
  PUSH: {
    radial: "from-amber-500/15 via-orange-500/5 to-transparent",
    borderHover: "hover:border-amber-400/40 hover:shadow-[0_0_24px_rgba(245,158,11,0.18)]",
    pill: "bg-amber-500/15 border-amber-400/30 text-amber-300",
  },
  PULL: {
    radial: "from-sky-500/15 via-blue-500/5 to-transparent",
    borderHover: "hover:border-sky-400/40 hover:shadow-[0_0_24px_rgba(56,189,248,0.18)]",
    pill: "bg-sky-500/15 border-sky-400/30 text-sky-300",
  },
  LEGS: {
    radial: "from-purple-500/15 via-violet-500/5 to-transparent",
    borderHover: "hover:border-purple-400/40 hover:shadow-[0_0_24px_rgba(168,85,247,0.18)]",
    pill: "bg-purple-500/15 border-purple-400/30 text-purple-300",
  },
  UPPER: {
    radial: "from-indigo-500/15 via-blue-500/5 to-transparent",
    borderHover: "hover:border-indigo-400/40 hover:shadow-[0_0_24px_rgba(99,102,241,0.18)]",
    pill: "bg-indigo-500/15 border-indigo-400/30 text-indigo-300",
  },
  LOWER: {
    radial: "from-teal-500/15 via-emerald-500/5 to-transparent",
    borderHover: "hover:border-teal-400/40 hover:shadow-[0_0_24px_rgba(20,184,166,0.18)]",
    pill: "bg-teal-500/15 border-teal-400/30 text-teal-300",
  },
  FULL_BODY: {
    radial: "from-blue-500/15 via-cyan-500/5 to-transparent",
    borderHover: "hover:border-blue-400/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.18)]",
    pill: "bg-blue-500/15 border-blue-400/30 text-blue-300",
  },
  SHOULDERS_ARMS: {
    radial: "from-fuchsia-500/15 via-pink-500/5 to-transparent",
    borderHover: "hover:border-fuchsia-400/40 hover:shadow-[0_0_24px_rgba(217,70,239,0.18)]",
    pill: "bg-fuchsia-500/15 border-fuchsia-400/30 text-fuchsia-300",
  },
  CARDIO: {
    radial: "from-rose-500/15 via-orange-500/5 to-transparent",
    borderHover: "hover:border-rose-400/40 hover:shadow-[0_0_24px_rgba(244,63,94,0.18)]",
    pill: "bg-rose-500/15 border-rose-400/30 text-rose-300",
  },
  MOBILITY: {
    radial: "from-emerald-500/15 via-teal-500/5 to-transparent",
    borderHover: "hover:border-emerald-400/40 hover:shadow-[0_0_24px_rgba(16,185,129,0.18)]",
    pill: "bg-emerald-500/15 border-emerald-400/30 text-emerald-300",
  },
  REST: {
    radial: "from-slate-500/10 via-neutral-500/5 to-transparent",
    borderHover: "hover:border-slate-400/30 hover:shadow-[0_0_20px_rgba(148,163,184,0.12)]",
    pill: "bg-slate-500/15 border-slate-400/20 text-slate-300",
  },
  CUSTOM: {
    radial: "from-brand-500/15 via-amber-500/5 to-transparent",
    borderHover: "hover:border-brand-400/40 hover:shadow-[0_0_24px_rgba(var(--brand-glow),0.18)]",
    pill: "bg-brand-500/15 border-brand-400/30 text-brand-300",
  },
  neutral: {
    radial: "from-white/[0.05] via-transparent to-transparent",
    borderHover: "hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]",
    pill: "bg-white/10 border-white/20 text-white/90",
  },
}

export function GlassCard({
  variant = "neutral",
  interactive = false,
  showSheen = true,
  className,
  children,
  ...props
}: GlassCardProps) {
  const config = GLOW_VARIANTS[variant] ?? GLOW_VARIANTS.neutral

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/15 dark:border-white/10",
        "bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-neutral-950/70",
        "backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.20),inset_0_-1px_1px_rgba(0,0,0,0.25),0_12px_40px_rgba(0,0,0,0.30)]",
        "transition-colors duration-200",
        interactive && [
          "cursor-pointer active:scale-[0.99]",
          config.borderHover,
        ],
        className
      )}
      {...props}
    >
      {showSheen && <GlassSheen />}
      {/* Ambient corner light glow */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-16 -end-16 size-48 rounded-full blur-3xl opacity-70 bg-gradient-to-br",
          config.radial
        )}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
