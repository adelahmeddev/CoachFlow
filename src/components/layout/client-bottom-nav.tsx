"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, CalendarDays, Apple, UserRound, Dumbbell, MessageCircle } from "lucide-react"
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
    <nav className="fixed inset-x-3 bottom-4 z-50 rounded-[2rem] border border-white/10 bg-background/60 shadow-[0_4px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/45 dark:border-white/5 dark:shadow-[0_4px_30px_rgba(0,0,0,0.2)]" aria-label={t.common.openNavigation ?? "Main navigation"}>
      <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-around gap-1 px-2">
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
              onClick={() => {
                try { navigator.vibrate?.(8) } catch {}
              }}
              className={cn(
                "relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[1.5rem] text-[10px] font-medium transition-[color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring btn-pop active:scale-95",
                isActive
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl transition-[color,background-color,transform,box-shadow] duration-200",
                  isActive
                    ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-glow scale-110"
                    : "bg-transparent hover:bg-muted/50"
                )}
                aria-hidden="true"
              >
                <item.icon className="size-[20px] shrink-0" />
              </span>
              <span className="max-w-[72px] truncate leading-none">
                {lookup(t, item.labelKey)}
              </span>
              {showBadge && (
                <span className="absolute right-1 top-0 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--msg-orange)] text-white text-[9px] font-bold tabular-nums flex items-center justify-center animate-pulse shadow-sm">
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
