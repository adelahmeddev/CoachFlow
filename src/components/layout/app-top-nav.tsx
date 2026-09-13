"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LogOut,
  Menu,
  Flame,
  Users,
  UserPlus,
  Dumbbell,
  Apple,
  Crown,
  CreditCard,
  Newspaper,
  Settings,
  ShieldCheck,
  UserCog,
  LayoutDashboard,
  CalendarDays,
  Camera,
  UserRound,
  ChevronDown,
  Bell,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { Role } from "@/lib/db/enums"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/client"
import { ROLE_LABELS } from "@/lib/constants"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useBranding } from "@/components/branding/branding-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { BrandLogo } from "@/components/brand/brand-logo"
import { NotificationBell } from "@/components/features/notifications/notification-bell"
import { motion } from "@/components/motion"
import { haptics } from "@/lib/haptics"

const WhatsappIcon = (props: React.ComponentProps<"svg">) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
    <path d="M14 14a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1Z" />
    <path d="M9.5 8c0 1.5.5 3 1.5 4s2.5 1.5 4 1.5" />
  </svg>
)
const FacebookIcon = (props: React.ComponentProps<"svg">) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)
const InstagramIcon = (props: React.ComponentProps<"svg">) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

export type NavSubItem = {
  label: string
  href: string
  icon: LucideIcon
}

export type NavCategory = {
  key: string
  label: string
  href: string
  icon: LucideIcon
  matchPrefixes: string[]
  subItems?: NavSubItem[]
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("")
}

export function AppTopNav({
  name,
  role,
  homeHref,
  ticker,
}: {
  name: string
  role: Role
  homeHref: string
  /** Optional strip pinned to the bottom of the sticky header (e.g. client welcome ticker) */
  ticker?: React.ReactNode
}) {
  const pathname = usePathname()
  const { t, locale } = useI18n()
  const branding = useBranding()
  const isAr = locale === "ar"
  const [notifCount, setNotifCount] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetchCount = () => {
      if (document.visibilityState !== "visible") return
      fetch("/api/notifications/unread-count", { credentials: "include", cache: "no-store" as RequestCache })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => {
          if (!cancelled) setNotifCount(data.count ?? 0)
        })
        .catch(() => {})
    }
    fetchCount()
    const id = setInterval(fetchCount, 60000)
    const handler = () => fetchCount()
    const visHandler = () => {
      if (document.visibilityState === "visible") fetchCount()
    }
    window.addEventListener("notifications:read", handler)
    document.addEventListener("visibilitychange", visHandler)
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => {
      cancelled = true
      clearInterval(id)
      window.removeEventListener("notifications:read", handler)
      document.removeEventListener("visibilitychange", visHandler)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Navigation architecture by role
  const trainerCategories: NavCategory[] = [
    {
      key: "overview",
      label: isAr ? "نظرة عامة" : "Overview",
      href: "/dashboard",
      icon: Flame,
      matchPrefixes: ["/dashboard"],
    },
    {
      key: "athletes",
      label: isAr ? "الأبطال" : "Athletes",
      href: "/clients",
      icon: Users,
      matchPrefixes: ["/clients", "/onboarding"],
      subItems: [
        { label: isAr ? "كل الأبطال" : "All Athletes", href: "/clients", icon: Users },
        { label: isAr ? "إضافة بطل" : "Onboarding", href: "/onboarding", icon: UserPlus },
      ],
    },
    {
      key: "programs",
      label: isAr ? "البرامج" : "Programs",
      href: "/training-split-templates",
      icon: Dumbbell,
      matchPrefixes: ["/training-split-templates", "/nutrition-templates"],
      subItems: [
        { label: isAr ? "جداول التمارين" : "Workout Splits", href: "/training-split-templates", icon: Dumbbell },
        { label: isAr ? "الأنظمة الغذائية" : "Nutrition Plans", href: "/nutrition-templates", icon: Apple },
      ],
    },
    {
      key: "business",
      label: isAr ? "البزنس" : "Business",
      href: "/subscription-plans",
      icon: Crown,
      matchPrefixes: ["/subscription-plans", "/subscription", "/blog"],
      subItems: [
        { label: isAr ? "خطط الاشتراك" : "Plans", href: "/subscription-plans", icon: Crown },
        { label: isAr ? "اشتراكي" : "My Membership", href: "/subscription", icon: CreditCard },
        { label: isAr ? "المقالات" : "Blog", href: "/blog", icon: Newspaper },
      ],
    },
  ]

  const adminCategories: NavCategory[] = [
    {
      key: "overview",
      label: isAr ? "نظرة عامة" : "Overview",
      href: "/admin",
      icon: ShieldCheck,
      matchPrefixes: ["/admin"],
    },
    {
      key: "trainers",
      label: isAr ? "المدربين" : "Trainers",
      href: "/admin/trainers",
      icon: UserCog,
      matchPrefixes: ["/admin/trainers"],
    },
    {
      key: "clients",
      label: isAr ? "الأبطال" : "Athletes",
      href: "/admin/clients",
      icon: Users,
      matchPrefixes: ["/admin/clients"],
    },
    {
      key: "subscriptions",
      label: isAr ? "الاشتراكات" : "Subscriptions",
      href: "/admin/subscriptions",
      icon: CreditCard,
      matchPrefixes: ["/admin/subscriptions"],
    },
  ]

  const clientCategories: NavCategory[] = [
    {
      key: "home",
      label: isAr ? "الرئيسية" : "Home",
      href: "/client/home",
      icon: LayoutDashboard,
      matchPrefixes: ["/client/home"],
    },
    {
      key: "training",
      label: isAr ? "التدريب" : "Training",
      href: "/client/week",
      icon: Dumbbell,
      matchPrefixes: ["/client/week", "/client/workout"],
      subItems: [
        { label: isAr ? "جدول الأسبوع" : "Weekly Schedule", href: "/client/week", icon: CalendarDays },
        { label: isAr ? "تمرين اليوم" : "Today's Workout", href: "/client/workout/today", icon: Dumbbell },
      ],
    },
    {
      key: "nutrition",
      label: isAr ? "التغذية" : "Fuel",
      href: "/client/nutrition",
      icon: Apple,
      matchPrefixes: ["/client/nutrition", "/client/media"],
      subItems: [
        { label: isAr ? "الدايت" : "Meal Plan", href: "/client/nutrition", icon: Apple },
        { label: isAr ? "الصور والقياسات" : "Media & Progress", href: "/client/media", icon: Camera },
      ],
    },
    {
      key: "profile",
      label: isAr ? "حسابي" : "Profile",
      href: "/client/profile",
      icon: UserRound,
      matchPrefixes: ["/client/profile"],
    },
  ]

  const categories =
    role === "COACH"
      ? trainerCategories
      : role === "SUPER_ADMIN"
      ? adminCategories
      : clientCategories

  // Active Category detection
  const activeCategory = categories.find((cat) =>
    cat.matchPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  )

  const hasSubItems = Boolean(activeCategory?.subItems && activeCategory.subItems.length > 0)
  const notificationsHref = role === "CLIENT" ? "/client/notifications" : "/notifications"
  const settingsHref = role === "CLIENT" ? "/client/profile" : "/settings"
  // Direct notification shortcuts are only valid for roles that own those
  // routes (COACH + CLIENT). SUPER_ADMIN has no /notifications page,
  // so the shortcuts stay hidden for that role instead of bouncing to /admin.
  const showNotificationShortcuts = role === "COACH" || role === "CLIENT"
  const isNotificationsActive =
    pathname === notificationsHref || pathname.startsWith(`${notificationsHref}/`)

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b border-white/10 bg-background/60 backdrop-blur-xl transition-all duration-300 supports-[backdrop-filter]:bg-background/45 dark:border-white/5",
      scrolled
        ? "shadow-[0_4px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.25)]"
        : "shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.2)]"
    )}>
      {/* TIER 1: MAIN NAVIGATION BAR */}
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3.5 py-2.5 sm:gap-4 md:px-8">
        {/* Start: Mobile Hamburger + Brand Logo */}
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          {/* Mobile Sheet Trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 md:hidden"
                aria-label={t.common.openNavigation}
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="start"
              showCloseButton={false}
              className="w-[280px] p-0 sm:max-w-[280px]"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>{t.common.openNavigation}</SheetTitle>
              </SheetHeader>
              <div className="flex h-full flex-col p-4">
                <Link
                  href={homeHref}
                  onClick={() => setMobileOpen(false)}
                  className="mb-6 flex items-center gap-3"
                  aria-label="Coach Flow"
                >
                  <BrandLogo variant="mark" height={44} width={44} alt="" quality={95} showWordmark />
                </Link>

                <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
                  {categories.map((cat) => {
                    const isCatActive = activeCategory?.key === cat.key
                    return (
                      <div key={cat.key} className="space-y-1">
                        <Link
                          href={cat.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-semibold transition-[color,background-color]",
                            isCatActive
                              ? "bg-brand-500/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <cat.icon className="size-4 shrink-0" aria-hidden="true" />
                          <span>{cat.label}</span>
                        </Link>
                        {cat.subItems && (
                          <div className="ms-6 flex flex-col gap-0.5 border-s border-border/60 ps-3">
                            {cat.subItems.map((sub) => {
                              const isSubActive = pathname === sub.href || pathname.startsWith(`${sub.href}/`)
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  onClick={() => setMobileOpen(false)}
                                  className={cn(
                                    "flex h-8 items-center gap-2 rounded-md px-2 text-xs font-medium transition-[color,background-color]",
                                    isSubActive
                                      ? "font-semibold text-brand-600 dark:text-brand-400"
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  <span>{sub.label}</span>
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </nav>

                {showNotificationShortcuts && (
                  <div className="space-y-1 border-t border-border/60 pt-4">
                    <Link
                      href={notificationsHref}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-semibold transition-[color,background-color]",
                        isNotificationsActive
                          ? "bg-brand-500/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Bell className="size-4 shrink-0" aria-hidden="true" />
                      <span className="flex-1">{t.nav.notifications}</span>
                      {notifCount > 0 && (
                        <Badge variant="default" className="h-4 px-1.5 text-[10px] tabular-nums bg-muscle-500">
                          {notifCount > 99 ? "99+" : notifCount}
                        </Badge>
                      )}
                    </Link>
                    <Link
                      href={settingsHref}
                      onClick={() => setMobileOpen(false)}
                      className="flex h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-semibold text-muted-foreground transition-[color,background-color] hover:bg-muted hover:text-foreground"
                    >
                      <Settings className="size-4 shrink-0" aria-hidden="true" />
                      <span>{t.nav.settings}</span>
                    </Link>
                  </div>
                )}

                <div className="mt-auto border-t border-border/60 pt-4">
                  <div className="flex items-center justify-between pb-3">
                    <ThemeToggle />
                    <LanguageSwitcher />
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => signOut({ callbackUrl: role === "CLIENT" ? "/client/login" : "/login" })}
                    className="w-full justify-start gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    <span>{t.nav.signOut}</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo Link */}
          <Link
            href={homeHref}
            className="flex shrink-0 items-center gap-2.5 transition-[opacity] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-[var(--radius-md)]"
            aria-label="Coach Flow"
          >
            <BrandLogo variant="mark" height={44} width={44} alt="" priority quality={95} showWordmark />
          </Link>
        </div>

        {/* Center: Desktop Primary Category Tabs */}
        <nav
          className="hidden md:flex items-center gap-1"
          aria-label={t.common.openNavigation ?? "Primary navigation"}
        >
          {categories.map((cat) => {
            const isActive = activeCategory?.key === cat.key
            return (
              <Link
                key={cat.key}
                href={cat.href}
                onClick={() => haptics.selection()}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative flex h-10 items-center gap-2 rounded-[var(--radius-md)] px-3.5 text-sm font-medium transition-[color,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "bg-muted/70 text-foreground font-semibold dark:bg-white/[0.08]"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:bg-white/[0.04]"
                )}
              >
                <cat.icon
                  className={cn(
                    "size-4 shrink-0 transition-[color] duration-150",
                    isActive ? "text-brand-600 dark:text-brand-400" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  aria-hidden="true"
                />
                <span>{cat.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="topNavActiveIndicator"
                    className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-600 dark:bg-brand-400"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    aria-hidden="true"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* End: Utilities (Social Media, User Dropdown) */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {branding?.whatsappUrl && (
            <Button asChild variant="ghost" size="icon" className="size-8 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all duration-200 active:scale-90 bg-[#25D366]/10 hover:bg-[#25D366]/20 border-[#25D366]/25 hover:border-[#25D366]/50 shadow-[0_0_10px_rgba(37,211,102,0.15)]">
              <a href={branding.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <WhatsappIcon className="size-4 text-[#25D366]" aria-hidden="true" />
              </a>
            </Button>
          )}
          {branding?.facebookUrl && (
            <Button asChild variant="ghost" size="icon" className="size-8 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all duration-200 active:scale-90 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border-[#1877F2]/25 hover:border-[#1877F2]/50 shadow-[0_0_10px_rgba(24,119,242,0.15)]">
              <a href={branding.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FacebookIcon className="size-4 text-[#1877F2]" aria-hidden="true" />
              </a>
            </Button>
          )}
          {branding?.instagramUrl && (
            <Button asChild variant="ghost" size="icon" className="size-8 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all duration-200 active:scale-90 bg-[#E1306C]/10 hover:bg-[#E1306C]/20 border-[#E1306C]/25 hover:border-[#E1306C]/50 shadow-[0_0_10px_rgba(225,48,108,0.15)]">
              <a href={branding.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <InstagramIcon className="size-4 text-[#E1306C]" aria-hidden="true" />
              </a>
            </Button>
          )}

          {showNotificationShortcuts && <NotificationBell href={notificationsHref} />}

          <div className="h-4 w-px bg-border/80 mx-1 hidden sm:block" aria-hidden="true" />

          {/* User Profile Dropdown — desktop only; mobile uses the sheet menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="hidden h-10 items-center gap-2 rounded-full p-1 pe-2.5 text-start hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring md:flex"
                aria-label="User menu"
              >
                <div className="relative">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-soft ring-1 ring-inset ring-black/10 dark:bg-brand-500">
                    {getInitials(name)}
                  </div>
                  {(notifCount > 0) && (
                    <span className="absolute -top-0.5 -end-0.5 flex size-3 items-center justify-center rounded-full bg-destructive ring-2 ring-background" />
                  )}
                </div>
                <span className="hidden lg:inline-block max-w-[120px] truncate text-xs font-semibold">
                  {name}
                </span>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground hidden sm:inline-block" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAr ? "start" : "end"} className="w-56 p-1.5">
              <DropdownMenuLabel className="font-normal p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">{name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    <Badge variant="secondary" className="mt-1 px-1.5 py-0 text-[10px]">
                      {ROLE_LABELS[role]}
                    </Badge>
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={settingsHref} className="flex w-full items-center gap-2 cursor-pointer">
                  <Settings className="size-4" aria-hidden="true" />
                  <span>{t.nav.settings}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={notificationsHref} className="flex w-full items-center gap-2 cursor-pointer">
                  <Bell className="size-4" aria-hidden="true" />
                  <span>{t.nav.notifications}</span>
                  {notifCount > 0 && (
                    <Badge variant="default" className="ms-auto h-4 px-1.5 text-[10px] tabular-nums bg-muscle-500">
                      {notifCount > 99 ? "99+" : notifCount}
                    </Badge>
                  )}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between p-2">
                <span className="text-sm">{t.common.switchLanguage}</span>
                <LanguageSwitcher />
              </div>
              <div className="flex items-center justify-between p-2">
                <span className="text-sm">Theme</span>
                <ThemeToggle />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: role === "CLIENT" ? "/client/login" : "/login" })}
                className="flex w-full items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span>{t.nav.signOut}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* TIER 2: CONTEXTUAL SECONDARY SUB-NAV BAR (Desktop Only) */}
      {hasSubItems && (
        <div className="hidden md:block border-t border-border/60 bg-muted/10 backdrop-blur-md transition-[background-color]">
          <div className="mx-auto flex h-11 w-full max-w-7xl items-center gap-2 px-4 md:px-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 me-2 select-none">
              {activeCategory?.label}
            </span>
            <div className="flex items-center gap-1">
              {activeCategory?.subItems?.map((sub) => {
                const isSubActive = pathname === sub.href || pathname.startsWith(`${sub.href}/`)
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={() => haptics.selection()}
                    aria-current={isSubActive ? "page" : undefined}
                    className={cn(
                      "relative flex h-7 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-xs font-medium transition-[color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSubActive
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isSubActive && (
                      <motion.span
                        layoutId="subNavActiveIndicator"
                        className="absolute inset-0 rounded-[var(--radius-sm)] bg-card shadow-soft ring-1 ring-border/80 dark:bg-white/[0.08]"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        aria-hidden="true"
                      />
                    )}
                    <sub.icon
                      className={cn(
                        "relative z-10 size-3.5 shrink-0 transition-colors",
                        isSubActive ? "text-brand-600 dark:text-brand-400" : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <span className="relative z-10">{sub.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
      {ticker}
    </header>
  )
}
