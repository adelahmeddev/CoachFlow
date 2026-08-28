"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LogOut, Menu } from "lucide-react"
import type { Role } from "@/generated/prisma/enums"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/client"
import type { Dictionary } from "@/lib/i18n/messages/en"
import { ROLE_LABELS } from "@/lib/constants"
import type { NavItem } from "@/components/layout/nav-items"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { BrandLogo } from "@/components/brand/brand-logo"

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

function SidebarNav({
  items,
  homeHref,
  onNavigate,
}: {
  items: NavItem[]
  homeHref: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const { t } = useI18n()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const fetchCount = () => {
      fetch("/api/messages/unread-count", { credentials: "include" })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { if (!cancelled) setUnreadCount(data.count ?? 0) })
        .catch(() => {})
    }
    fetchCount()
    const id = setInterval(fetchCount, 30000)
    const handler = () => fetchCount()
    window.addEventListener('messages:read', handler)
    return () => { cancelled = true; clearInterval(id); window.removeEventListener('messages:read', handler) }
  }, [])

  return (
    <nav className="flex flex-col gap-1 px-3 py-3" aria-label={t.common.openNavigation}>
      <Link
        href={homeHref}
        onClick={onNavigate}
        className="mb-4 flex h-16 shrink-0 items-center gap-3.5 rounded-2xl px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="NANOUSH"
      >
        <BrandLogo variant="mark" height={36} width={56} alt="" priority quality={100} className="drop-shadow-sm" />
        <span className="text-lg font-extrabold tracking-tight">NANOUSH</span>
      </Link>

      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`)
        const isMessages = item.href === "/messages" || item.href === "/client/messages"
        const showBadge = isMessages && unreadCount > 0
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
              isActive
                ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-soft ring-1 ring-brand-700/20 dark:from-brand-500 dark:to-brand-600 dark:ring-white/10"
                : "text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-soft hover:ring-1 hover:ring-border dark:hover:bg-white/[0.06] dark:hover:text-foreground"
            )}
          >
            <item.icon
              className={cn(
                "size-[18px] shrink-0 transition-colors",
                isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
              )}
              aria-hidden="true"
            />
            <span className="truncate">{lookup(t, item.titleKey)}</span>
            {showBadge && (
              <span className="absolute end-2 top-1/2 -translate-y-1/2 min-w-[20px] h-5 px-1 rounded-full bg-[var(--msg-orange)] text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarFooter({ role }: { role: Role }) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-2.5 border-t border-border/60 p-3">
      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <Button
        variant="ghost"
        onClick={() =>
          signOut({ callbackUrl: role === "CLIENT" ? "/client/login" : "/login" })
        }
        className="h-11 justify-start gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-soft focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LogOut className="size-[18px] shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate text-start">{t.nav.signOut}</span>
      </Button>
    </div>
  )
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("")
}

function UserSummary({ name, role }: { name: string; role: Role }) {
  return (
    <div className="mx-3 flex min-h-[52px] items-center gap-3 rounded-xl border bg-card px-3 py-2 shadow-soft">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white shadow-soft">
        {getInitials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-none">{name}</p>
        <Badge variant="secondary" className="mt-1 gap-1 px-1.5 text-[10px] font-medium">
          {ROLE_LABELS[role]}
        </Badge>
      </div>
    </div>
  )
}

export function AppSidebar({
  name,
  role,
  items,
  homeHref,
}: {
  name: string
  role: Role
  items: NavItem[]
  homeHref: string
}) {
  return (
    <>
      {/* Desktop sidebar (md+): fixed on the inline-start side */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-[272px] flex-col border-e bg-surface-strong/80 backdrop-blur-xl supports-[backdrop-filter]:bg-surface-strong/70 md:flex">
        <SidebarNav items={items} homeHref={homeHref} />
        <div className="flex-1" />
        <UserSummary name={name} role={role} />
        <SidebarFooter role={role} />
      </aside>

      {/* Mobile top bar (<md): menu button + page title + controls */}
      <MobileTopBar
        name={name}
        role={role}
        items={items}
        homeHref={homeHref}
      />
    </>
  )
}

function MobileTopBar({
  name,
  role,
  items,
  homeHref,
}: {
  name: string
  role: Role
  items: NavItem[]
  homeHref: string
}) {
  const pathname = usePathname()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  const activeItem =
    items.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    ) ?? items.find((item) => item.href === homeHref)

  return (
    <header className="sticky top-0 z-40 border-b bg-surface-strong/90 backdrop-blur-xl supports-[backdrop-filter]:bg-surface-strong/80 md:hidden">
      <div className="flex h-14 items-center gap-2 px-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 shrink-0"
              aria-label={t.common.openNavigation}
              title={t.common.openNavigation}
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
            <div className="flex h-full flex-col">
              <SidebarNav
                items={items}
                homeHref={homeHref}
                onNavigate={() => setOpen(false)}
              />
              <div className="flex-1" />
              <UserSummary name={name} role={role} />
              <SidebarFooter role={role} />
            </div>
          </SheetContent>
        </Sheet>

        <h1 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight">
          {activeItem ? lookup(t, activeItem.titleKey) : "Coach"}
        </h1>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
