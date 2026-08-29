"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, CalendarDays, BarChart3, Apple, UserRound, Dumbbell, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/client"
import type { Dictionary } from "@/lib/i18n/messages/en"

type BottomNavItem = {
  key: string
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

const CLIENT_BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { key: "home", labelKey: "client.home.greeting", icon: LayoutDashboard, href: "/client/home" },
  { key: "week", labelKey: "client.week.myWeek", icon: CalendarDays, href: "/client/week" },
  { key: "workout", labelKey: "client.workout.startWorkout", icon: Dumbbell, href: "/client/workout/today" },
  { key: "messages", labelKey: "nav.messages", icon: MessageCircle, href: "/client/messages" },
  { key: "progress", labelKey: "client.progress.title", icon: BarChart3, href: "/client/progress" },
  { key: "nutrition", labelKey: "client.nutrition.myPlan", icon: Apple, href: "/client/nutrition" },
  { key: "profile", labelKey: "client.profile.myInfo", icon: UserRound, href: "/client/profile" },
]

function lookup(t: Dictionary, path: string): string {
  return path
    .split(".")
    .reduce<unknown>((acc, part) => {
      if (typeof acc === "object" && acc !== null) {
        return (acc as Record<string, unknown>)[part]
      }
      return acc
    }, t as unknown) as string
}

export function ClientBottomNav() {
  const { t } = useI18n()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const fetchCount = () => {
      if (document.visibilityState !== "visible") return
      fetch("/api/messages/unread-count", { credentials: "include", cache: "no-store" as RequestCache })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { if (!cancelled) setUnreadCount(data.count ?? 0) })
        .catch(() => {})
    }
    fetchCount()
    const id = setInterval(fetchCount, 60000)
    const handler = () => fetchCount()
    const visHandler = () => { if (document.visibilityState === "visible") fetchCount() }
    window.addEventListener('messages:read', handler)
    document.addEventListener('visibilitychange', visHandler)
    return () => { cancelled = true; clearInterval(id); window.removeEventListener('messages:read', handler); document.removeEventListener('visibilitychange', visHandler) }
  }, [])

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/90 backdrop-blur-xl safe-bottom supports-[backdrop-filter]:bg-background/80" aria-label={t.common.openNavigation ?? "Main navigation"}>
      <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-around gap-1 px-2 pb-1">
        {CLIENT_BOTTOM_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          const isMessages = item.key === "messages"
          const showBadge = isMessages && unreadCount > 0
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={lookup(t, item.labelKey)}
              className={cn(
                "relative flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]",
                isActive
                  ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-soft dark:from-brand-500 dark:to-brand-600"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-white/10"
              )}
            >
              <item.icon className="size-[20px] shrink-0" aria-hidden="true" />
              <span className="max-w-[64px] truncate leading-none">
                {lookup(t, item.labelKey)}
              </span>
              {showBadge && (
                <span className="absolute right-3 top-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--msg-orange)] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
