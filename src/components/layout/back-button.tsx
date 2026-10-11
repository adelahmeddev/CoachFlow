"use client"

import { useRouter, usePathname } from "next/navigation"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  className?: string
  fallbackHref?: string
  showText?: boolean
}

export function BackButton({
  className,
  fallbackHref,
  showText = true,
}: BackButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { locale } = useI18n()
  const isAr = locale === "ar"

  // Do not show on home/dashboard
  if (pathname === "/dashboard" || pathname === "/") {
    return null
  }

  const handleBack = () => {
    // If the user arrived via a link or direct open with limited history
    if (typeof window !== "undefined" && window.history.length <= 2) {
      if (fallbackHref) {
        router.push(fallbackHref)
        return
      }

      // Infer logical parent path
      const segments = pathname.split("/").filter(Boolean)
      if (segments.length > 1) {
        segments.pop()
        router.push(`/${segments.join("/")}`)
        return
      }

      router.push("/dashboard")
      return
    }

    router.back()
  }

  // In RTL (Arabic), "Back" points to the right. In LTR (English), it points to the left.
  const Icon = isAr ? ArrowRight : ArrowLeft

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        "inline-flex items-center gap-1.5 h-8.5 px-2 sm:px-2.5 rounded-xl border border-border/70 bg-card/60 hover:bg-brand-500/10 hover:border-brand-500/30 hover:text-brand-600 dark:hover:text-brand-400 text-foreground transition-all duration-150 shrink-0 shadow-xs active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-xs font-bold cursor-pointer",
        className
      )}
      title={isAr ? "رجوع للصفحة السابقة" : "Go back to previous page"}
      aria-label={isAr ? "رجوع للصفحة السابقة" : "Go back"}
    >
      <Icon className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
      {showText && (
        <span className="hidden sm:inline">
          {isAr ? "رجوع" : "Back"}
        </span>
      )}
    </button>
  )
}
