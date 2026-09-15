"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Flame,
  Users,
  MessageCircle,
  Plus,
  MoreHorizontal,
  Dumbbell,
  Apple,
  Crown,
  Newspaper,
  Settings,
  UserPlus,
  LogOut,
  Bell,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/client"
import { haptics } from "@/lib/haptics"
import { QuickActionDialog } from "@/components/features/dashboard/quick-action-dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { LanguageSwitcher } from "@/components/layout/language-switcher"

export function TrainerBottomNav() {
  const pathname = usePathname()
  const { locale, t } = useI18n()
  const isAr = locale === "ar"

  const [quickActionOpen, setQuickActionOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread messages count for trainer
  useEffect(() => {
    let cancelled = false
    const fetchCount = () => {
      if (document.visibilityState !== "visible") return
      fetch("/api/messages/unread-count", {
        credentials: "include",
        cache: "no-store" as RequestCache,
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => {
          if (!cancelled) setUnreadCount(data.count ?? 0)
        })
        .catch(() => {})
    }

    fetchCount()
    const id = setInterval(fetchCount, 45000)
    const handler = () => fetchCount()
    const visHandler = () => {
      if (document.visibilityState === "visible") fetchCount()
    }

    window.addEventListener("messages:read", handler)
    document.addEventListener("visibilitychange", visHandler)

    return () => {
      cancelled = true
      clearInterval(id)
      window.removeEventListener("messages:read", handler)
      document.removeEventListener("visibilitychange", visHandler)
    }
  }, [])

  const isHomeActive = pathname === "/dashboard"
  const isClientsActive = pathname === "/clients" || pathname.startsWith("/clients/")
  const isMessagesActive = pathname === "/messages" || pathname.startsWith("/messages/")
  const isMoreActive =
    pathname.startsWith("/training-split-templates") ||
    pathname.startsWith("/nutrition-templates") ||
    pathname.startsWith("/subscription-plans") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/onboarding")

  return (
    <>
      <nav
        aria-label="Mobile Coach Navigation"
        className="fixed inset-x-3 bottom-3 z-40 md:hidden rounded-[2rem] border border-white/10 bg-background/70 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl supports-[backdrop-filter]:bg-background/55 dark:border-white/5 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
      >
        <div className="mx-auto flex h-[62px] items-center justify-around px-2">
          {/* 1. Dashboard */}
          <Link
            href="/dashboard"
            onClick={() => haptics.selection()}
            aria-current={isHomeActive ? "page" : undefined}
            className={cn(
              "relative flex h-full flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors duration-150 active:scale-95",
              isHomeActive
                ? "text-brand-600 dark:text-brand-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-xl transition-all duration-150",
                isHomeActive
                  ? "bg-brand-500/15 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 scale-105"
                  : "bg-transparent"
              )}
            >
              <Flame className="size-5" />
            </span>
            <span className="leading-none">{isAr ? "الرئيسية" : "Home"}</span>
          </Link>

          {/* 2. Athletes */}
          <Link
            href="/clients"
            onClick={() => haptics.selection()}
            aria-current={isClientsActive ? "page" : undefined}
            className={cn(
              "relative flex h-full flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors duration-150 active:scale-95",
              isClientsActive
                ? "text-brand-600 dark:text-brand-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-xl transition-all duration-150",
                isClientsActive
                  ? "bg-brand-500/15 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 scale-105"
                  : "bg-transparent"
              )}
            >
              <Users className="size-5" />
            </span>
            <span className="leading-none">{isAr ? "الأبطال" : "Athletes"}</span>
          </Link>

          {/* 3. Elevated Center (+) Action Button */}
          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              onClick={() => {
                haptics.selection()
                setQuickActionOpen(true)
              }}
              aria-label={isAr ? "إضافة جديدة" : "Quick Add"}
              className="flex size-11 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 via-brand-500 to-energy-500 text-white shadow-glow ring-2 ring-background transition-transform duration-150 active:scale-90 hover:brightness-110 -translate-y-2"
            >
              <Plus className="size-6 stroke-[2.5]" />
            </button>
          </div>

          {/* 4. Messages */}
          <Link
            href="/messages"
            onClick={() => haptics.selection()}
            aria-current={isMessagesActive ? "page" : undefined}
            className={cn(
              "relative flex h-full flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors duration-150 active:scale-95",
              isMessagesActive
                ? "text-brand-600 dark:text-brand-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "relative flex size-8 items-center justify-center rounded-xl transition-all duration-150",
                isMessagesActive
                  ? "bg-brand-500/15 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 scale-105"
                  : "bg-transparent"
              )}
            >
              <MessageCircle className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -end-1 flex min-w-[16px] h-[16px] items-center justify-center rounded-full bg-muscle-500 px-1 text-[9px] font-extrabold text-white tabular-nums shadow-sm animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
            <span className="leading-none">{isAr ? "المحادثات" : "Chat"}</span>
          </Link>

          {/* 5. More (Sheet Trigger) */}
          <button
            type="button"
            onClick={() => {
              haptics.selection()
              setMoreOpen(true)
            }}
            className={cn(
              "relative flex h-full flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors duration-150 active:scale-95",
              isMoreActive
                ? "text-brand-600 dark:text-brand-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-xl transition-all duration-150",
                isMoreActive
                  ? "bg-brand-500/15 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 scale-105"
                  : "bg-transparent"
              )}
            >
              <MoreHorizontal className="size-5" />
            </span>
            <span className="leading-none">{isAr ? "المزيد" : "More"}</span>
          </button>
        </div>
      </nav>

      {/* Quick Action Modal */}
      <QuickActionDialog
        open={quickActionOpen}
        onOpenChange={setQuickActionOpen}
      />

      {/* More / Library Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] rounded-t-[2rem] border-t p-5 bg-card/95 backdrop-blur-2xl"
        >
          <SheetHeader className="pb-3 border-b text-start">
            <SheetTitle className="text-base font-bold">
              {isAr ? "المكتبة وإدارة الحساب" : "Library & Studio"}
            </SheetTitle>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-2.5 py-4">
            <Link
              href="/training-split-templates"
              onClick={() => setMoreOpen(false)}
              className="flex flex-col items-start gap-2 rounded-2xl border bg-muted/30 p-3.5 transition-colors hover:bg-brand-500/10 hover:border-brand-500/30"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-muscle-500/15 text-muscle-600 dark:text-muscle-400">
                <Dumbbell className="size-5" />
              </span>
              <div>
                <p className="font-bold text-xs">{isAr ? "جداول التمارين" : "Workout Splits"}</p>
                <p className="text-[11px] text-muted-foreground">{isAr ? "النماذج والسبليتس" : "Templates"}</p>
              </div>
            </Link>

            <Link
              href="/nutrition-templates"
              onClick={() => setMoreOpen(false)}
              className="flex flex-col items-start gap-2 rounded-2xl border bg-muted/30 p-3.5 transition-colors hover:bg-brand-500/10 hover:border-brand-500/30"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-energy-500/15 text-energy-600 dark:text-energy-400">
                <Apple className="size-5" />
              </span>
              <div>
                <p className="font-bold text-xs">{isAr ? "الأنظمة الغذائية" : "Nutrition Plans"}</p>
                <p className="text-[11px] text-muted-foreground">{isAr ? "خطط الوجبات" : "Meal plans"}</p>
              </div>
            </Link>

            <Link
              href="/subscription-plans"
              onClick={() => setMoreOpen(false)}
              className="flex flex-col items-start gap-2 rounded-2xl border bg-muted/30 p-3.5 transition-colors hover:bg-brand-500/10 hover:border-brand-500/30"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                <Crown className="size-5" />
              </span>
              <div>
                <p className="font-bold text-xs">{isAr ? "باقات التدريب" : "Packages"}</p>
                <p className="text-[11px] text-muted-foreground">{isAr ? "الأسعار والحصص" : "Pricing & PT"}</p>
              </div>
            </Link>

            <Link
              href="/onboarding"
              onClick={() => setMoreOpen(false)}
              className="flex flex-col items-start gap-2 rounded-2xl border bg-muted/30 p-3.5 transition-colors hover:bg-brand-500/10 hover:border-brand-500/30"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                <UserPlus className="size-5" />
              </span>
              <div>
                <p className="font-bold text-xs">{isAr ? "روابط الدعوة" : "Invite Links"}</p>
                <p className="text-[11px] text-muted-foreground">{isAr ? "QR ورابط الانضمام" : "QR & Slugs"}</p>
              </div>
            </Link>

            <Link
              href="/blog"
              onClick={() => setMoreOpen(false)}
              className="flex flex-col items-start gap-2 rounded-2xl border bg-muted/30 p-3.5 transition-colors hover:bg-brand-500/10 hover:border-brand-500/30"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-performance-500/15 text-performance-600 dark:text-performance-400">
                <Newspaper className="size-5" />
              </span>
              <div>
                <p className="font-bold text-xs">{isAr ? "المقالات والتحولات" : "Blog Posts"}</p>
                <p className="text-[11px] text-muted-foreground">{isAr ? "محتوى الأبطال" : "Client stories"}</p>
              </div>
            </Link>

            <Link
              href="/notifications"
              onClick={() => setMoreOpen(false)}
              className="flex flex-col items-start gap-2 rounded-2xl border bg-muted/30 p-3.5 transition-colors hover:bg-brand-500/10 hover:border-brand-500/30"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
                <Bell className="size-5" />
              </span>
              <div>
                <p className="font-bold text-xs">{isAr ? "التنبيهات" : "Notifications"}</p>
                <p className="text-[11px] text-muted-foreground">{isAr ? "إشعارات المنصة" : "System alerts"}</p>
              </div>
            </Link>
          </div>

          <div className="border-t pt-3 space-y-2">
            <Link
              href="/settings"
              onClick={() => setMoreOpen(false)}
              className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold hover:bg-muted"
            >
              <Settings className="size-4 text-muted-foreground" />
              <span>{isAr ? "إعدادات الحساب والبراند" : "Settings & Branding"}</span>
            </Link>

            <div className="flex items-center justify-between px-3 py-1">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              <span>{t.nav.signOut}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
