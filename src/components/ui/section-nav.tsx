"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ClipboardCheck, Dumbbell, Apple, TrendingUp, Package, type LucideIcon } from "lucide-react"

export type SectionKey = "overview" | "body-composition" | "training-split" | "nutrition" | "progress" | "subscription"

export const SECTION_META: Record<SectionKey, { label: string; labelEn: string; icon: LucideIcon; accent: string }> = {
  overview: { label: "ملخص", labelEn: "Overview", icon: LayoutDashboard, accent: "brand" },
  "body-composition": { label: "المتابعة", labelEn: "Check-in", icon: ClipboardCheck, accent: "performance" },
  "training-split": { label: "التمرين", labelEn: "Training", icon: Dumbbell, accent: "muscle" },
  nutrition: { label: "التغذية", labelEn: "Nutrition", icon: Apple, accent: "energy" },
  progress: { label: "التقدم", labelEn: "Progress", icon: TrendingUp, accent: "performance" },
  subscription: { label: "الباقة", labelEn: "Package", icon: Package, accent: "brand" },
}

interface SectionNavProps {
  clientId: string
  active: SectionKey
  onChange?: (key: SectionKey) => void
  // optional badges
  badges?: Partial<Record<SectionKey, number | string>>
}

export function SectionNav({ clientId, active, onChange, badges }: SectionNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // fallback for non-JS navigation via Links
  const makeHref = (key: SectionKey) => {
    if (key === "overview") return `/clients/${clientId}`
    return `/clients/${clientId}?tab=${key}`
  }

  return (
    <div className="sticky top-0 sm:top-[1px] z-30 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 border-b sm:border sm:rounded-2xl sm:bg-card/60 sm:shadow-soft">
      <div
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory"
        role="tablist"
        aria-label="Client sections"
      >
        {(Object.entries(SECTION_META) as [SectionKey, typeof SECTION_META[SectionKey]][]).map(([key, meta]) => {
          const isActive = active === key
          const Icon = meta.icon
          const badge = badges?.[key]
          const accentMap: Record<string, string> = {
            brand: "from-brand-500 to-brand-600 shadow-brand-500/20",
            performance: "from-performance-500 to-performance-600 shadow-performance-500/20",
            muscle: "from-muscle-500 to-brand-500 shadow-muscle-500/20",
            energy: "from-energy-500 to-brand-500 shadow-energy-500/20",
          }
          const accent = accentMap[meta.accent] ?? accentMap.brand

          const content = (
            <>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isActive
                    ? "bg-white/15 text-white"
                    : "bg-muted text-muted-foreground group-hover:bg-card group-hover:text-foreground group-hover:shadow-soft"
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap text-sm font-semibold tracking-tight">{meta.label}</span>
              {badge !== undefined && badge !== null && badge !== 0 && badge !== "" ? (
                <span
                  className={cn(
                    "ms-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                    isActive ? "bg-white/20 text-white" : "bg-brand-500 text-white"
                  )}
                >
                  {typeof badge === "number" && badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </>
          )

          const className = cn(
            "group relative inline-flex snap-start shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isActive
              ? `bg-gradient-to-r ${accent} text-white shadow-soft`
              : "bg-card border text-muted-foreground hover:text-foreground hover:border-brand-200 hover:shadow-soft dark:hover:border-brand-900/30"
          )

          if (onChange) {
            return (
              <button
                key={key}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(key)}
                className={className}
              >
                {content}
              </button>
            )
          }

          return (
            <Link
              key={key}
              href={makeHref(key)}
              aria-current={isActive ? "page" : undefined}
              className={className}
              scroll={false}
            >
              {content}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
