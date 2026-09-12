"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Activity, Lightbulb, Salad } from "lucide-react"
import { useBranding } from "@/components/branding/branding-provider"
import { useI18n } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"

/**
 * Coach hero showcase — dark glass card opening the client home portal.
 * Reads coach identity exclusively from the live BrandingProvider (name,
 * logo, primary color), so a Settings save re-renders it with no refresh.
 * Layout is RTL-first: flex-row auto-mirrors, logical props throughout.
 */
export function CoachHeroShowcase() {
  const branding = useBranding()
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const [imgFailed, setImgFailed] = useState(false)

  const logoSrc = !imgFailed && branding.logoUrl ? branding.logoUrl : "/brand/logo.png"

  const pills = [
    { Icon: Lightbulb, ar: "نصيحة اليوم", en: "Tip of the day" },
    { Icon: Salad, ar: "توجيه غذائي", en: "Nutrition guidance" },
    { Icon: Activity, ar: "متابعة مستمرة", en: "Ongoing follow-up" },
  ]

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      aria-label={branding.brandName}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900/90 to-neutral-950/95 p-5 shadow-2xl backdrop-blur-2xl"
    >
      {/* Ambient glows */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -end-24 size-72 rounded-full bg-primary/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -start-20 size-64 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-5 sm:text-start">
        {/* Circular coach frame */}
        <div className="relative mx-auto h-40 w-40 shrink-0 rounded-full bg-gradient-to-tr from-amber-500/80 via-yellow-200/40 to-amber-700/80 p-1 shadow-[0_0_25px_rgba(234,179,8,0.2)] sm:mx-0 sm:h-48 sm:w-48 md:h-56 md:w-56">
          <div className="relative h-full w-full overflow-hidden rounded-full bg-black/60">
            <img
              key={logoSrc}
              src={logoSrc}
              alt={branding.brandName}
              className="h-full w-full object-cover"
              onError={() => setImgFailed(true)}
            />
          </div>
          {/* Live pulse dot on the rim */}
          <span aria-hidden="true" className="absolute bottom-3 start-3 size-3.5 animate-ping rounded-full bg-emerald-400/60" />
          <span aria-label={isAr ? "متصل" : "Online"} className="absolute bottom-3 start-3 size-3.5 rounded-full bg-emerald-500 ring-2 ring-neutral-900" />
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-amber-400/90">
            {isAr ? "تدريب فتنس أونلاين" : "Online fitness coaching"}
          </p>
          <h2 className="truncate font-heading text-xl font-black tracking-wide text-white md:text-2xl">
            {branding.brandName}
          </h2>
        </div>

        {/* Feature glass pills */}
        <div className="z-10 flex flex-row flex-wrap items-center justify-center gap-2 sm:flex-col sm:items-stretch">
          {pills.map(({ Icon, ar, en }) => (
            <span
              key={en}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-full border border-white/40 bg-white/85 px-4 py-1.5",
                "text-xs font-bold text-neutral-900 shadow-lg backdrop-blur-md",
                "transition-transform active:scale-95 dark:bg-white/90"
              )}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              {isAr ? ar : en}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
