"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { ReactNode } from "react"

interface FitnessCardProps {
  children: ReactNode
  className?: string
  variant?: "default" | "energy" | "muscle" | "performance" | "glass"
  hover?: boolean
  accent?: "brand" | "energy" | "muscle" | "performance" | "none"
}

export function FitnessCard({
  children,
  className,
  variant = "default",
  hover = true,
  accent = "brand",
}: FitnessCardProps) {
  const variantClasses = {
    default: "bg-card border shadow-soft",
    energy: "bg-card border border-energy-500/20 shadow-soft",
    muscle: "bg-card border border-muscle-500/20 shadow-soft",
    performance: "bg-card border border-performance-500/20 shadow-soft",
    glass: "glass shadow-glass",
  }[variant]

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl transition-all duration-300",
        variantClasses,
        hover && "hover:shadow-card-hover hover:-translate-y-0.5",
        className
      )}
    >
      {accent !== "none" && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-px opacity-60",
            accent === "brand" && "bg-gradient-to-r from-transparent via-brand-500 to-transparent",
            accent === "energy" && "bg-gradient-to-r from-transparent via-energy-500 to-transparent",
            accent === "muscle" && "bg-gradient-to-r from-transparent via-muscle-500 to-transparent",
            accent === "performance" && "bg-gradient-to-r from-transparent via-performance-500 to-transparent"
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  )
}

export function FitnessCardHeader({
  icon,
  title,
  subtitle,
  action,
  iconVariant = "brand",
  className,
}: {
  icon?: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
  iconVariant?: "brand" | "energy" | "muscle" | "performance" | "muted"
  className?: string
}) {
  const iconBg = {
    brand: "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-soft ring-1 ring-brand-600/20",
    energy: "bg-gradient-to-br from-energy-500 to-energy-600 text-white shadow-soft ring-1 ring-energy-600/20",
    muscle: "bg-gradient-to-br from-muscle-500 to-muscle-600 text-white shadow-soft ring-1 ring-muscle-600/20",
    performance: "bg-gradient-to-br from-performance-500 to-performance-600 text-white shadow-soft ring-1 ring-performance-600/20",
    muted: "bg-muted text-muted-foreground ring-1 ring-border",
  }[iconVariant]

  return (
    <div className={cn("flex items-start justify-between gap-3 p-5 pb-3", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconBg)}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight tracking-tight truncate">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground leading-tight mt-0.5 line-clamp-1">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function GradientText({
  children,
  variant = "energy",
  className,
}: {
  children: ReactNode
  variant?: "energy" | "muscle" | "performance"
  className?: string
}) {
  return (
    <span
      className={cn(
        "bg-clip-text text-transparent font-bold",
        variant === "energy" && "bg-gradient-to-r from-brand-600 to-energy-600 dark:from-brand-400 dark:to-energy-400",
        variant === "muscle" && "bg-gradient-to-r from-muscle-600 to-brand-600 dark:from-muscle-400 dark:to-brand-400",
        variant === "performance" && "bg-gradient-to-r from-performance-600 to-performance-400 dark:from-performance-400 dark:to-performance-300",
        className
      )}
    >
      {children}
    </span>
  )
}
