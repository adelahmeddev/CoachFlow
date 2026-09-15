"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Users,
  Dumbbell,
  Apple,
  MessageCircle,
  Settings,
  UserPlus,
  Flame,
  LayoutDashboard,
  Crown,
  Newspaper,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"
import {
  searchCoachWorkspaceAction,
  type SearchClientResult,
  type SearchTemplateResult,
} from "@/server/actions/search"
import { haptics } from "@/lib/haptics"

type QuickNavLink = {
  key: string
  labelAr: string
  labelEn: string
  href: string
  icon: typeof Flame
  keywords: string[]
}

const QUICK_NAV_LINKS: QuickNavLink[] = [
  {
    key: "dashboard",
    labelAr: "الرئيسية",
    labelEn: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: ["home", "dashboard", "رئيسية", "نظرة عامة"],
  },
  {
    key: "clients",
    labelAr: "كل الأبطال",
    labelEn: "All Athletes",
    href: "/clients",
    icon: Users,
    keywords: ["clients", "athletes", "أبطال", "عملاء", "مشتركين"],
  },
  {
    key: "messages",
    labelAr: "المحادثات",
    labelEn: "Messages & Chat",
    href: "/messages",
    icon: MessageCircle,
    keywords: ["messages", "chat", "شات", "رسائل", "محادثات"],
  },
  {
    key: "onboarding",
    labelAr: "دعوة بطل جديد / روابط الانضمام",
    labelEn: "Invite New Athlete / Join Links",
    href: "/onboarding",
    icon: UserPlus,
    keywords: ["invite", "onboard", "new", "qr", "دعوة", "إضافة", "رابط"],
  },
  {
    key: "splits",
    labelAr: "جداول التمارين",
    labelEn: "Workout Split Templates",
    href: "/training-split-templates",
    icon: Dumbbell,
    keywords: ["splits", "workout", "exercises", "تمارين", "جدول", "سبليت"],
  },
  {
    key: "nutrition",
    labelAr: "الأنظمة الغذائية",
    labelEn: "Nutrition Plan Templates",
    href: "/nutrition-templates",
    icon: Apple,
    keywords: ["nutrition", "diet", "meal", "food", "تغذية", "دايت", "وجبات"],
  },
  {
    key: "packages",
    labelAr: "باقات التدريب والاشتراكات",
    labelEn: "Subscription Packages",
    href: "/subscription-plans",
    icon: Crown,
    keywords: ["packages", "plans", "pricing", "باقات", "اشتراكات", "أسعار"],
  },
  {
    key: "blog",
    labelAr: "المقالات والتحولات",
    labelEn: "Blog & Transformation Stories",
    href: "/blog",
    icon: Newspaper,
    keywords: ["blog", "posts", "stories", "مقالات", "قصص", "تحولات"],
  },
  {
    key: "settings",
    labelAr: "إعدادات الحساب والبراند",
    labelEn: "Settings & Brand Customization",
    href: "/settings",
    icon: Settings,
    keywords: ["settings", "brand", "logo", "profile", "إعدادات", "لوجو", "براند"],
  },
]

export function GlobalSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const router = useRouter()

  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<SearchClientResult[]>([])
  const [templates, setTemplates] = useState<SearchTemplateResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for Cmd+K / Ctrl+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("")
      setClients([])
      setTemplates([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Filtered navigation shortcuts based on query
  const filteredNav = query.trim()
    ? QUICK_NAV_LINKS.filter((item) => {
        const q = query.toLowerCase()
        return (
          item.labelAr.toLowerCase().includes(q) ||
          item.labelEn.toLowerCase().includes(q) ||
          item.keywords.some((kw) => kw.includes(q))
        )
      })
    : QUICK_NAV_LINKS.slice(0, 5)

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setClients([])
      setTemplates([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timeoutId = setTimeout(async () => {
      const res = await searchCoachWorkspaceAction(trimmed)
      if (res.ok) {
        setClients(res.data.clients)
        setTemplates(res.data.templates)
      }
      setLoading(false)
      setSelectedIndex(0)
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Flattened items for keyboard up/down selection
  const allSelectableItems = [
    ...clients.map((c) => ({ type: "client" as const, item: c })),
    ...templates.map((t) => ({ type: "template" as const, item: t })),
    ...filteredNav.map((n) => ({ type: "nav" as const, item: n })),
  ]

  const handleSelect = useCallback(
    (index: number) => {
      const selected = allSelectableItems[index]
      if (!selected) return

      haptics.selection()
      onOpenChange(false)

      if (selected.type === "client") {
        router.push(`/clients/${selected.item.id}`)
      } else if (selected.type === "template") {
        if (selected.item.type === "split") {
          router.push(`/training-split-templates/${selected.item.id}/edit`)
        } else {
          router.push(`/nutrition-templates/${selected.item.id}/edit`)
        }
      } else if (selected.type === "nav") {
        router.push(selected.item.href)
      }
    },
    [allSelectableItems, onOpenChange, router]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev < allSelectableItems.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : allSelectableItems.length - 1
      )
    } else if (e.key === "Enter") {
      e.preventDefault()
      handleSelect(selectedIndex)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="outline" className="text-performance-600 border-performance-500/30 bg-performance-500/10 text-[10px]">{isAr ? "نشط" : "Active"}</Badge>
      case "PENDING_ASSESSMENT":
        return <Badge variant="outline" className="text-muscle-600 border-muscle-500/30 bg-muscle-500/10 text-[10px]">{isAr ? "محتاج تقييم" : "Assessment"}</Badge>
      case "INVITED":
        return <Badge variant="outline" className="text-energy-600 border-energy-500/30 bg-energy-500/10 text-[10px]">{isAr ? "تمت الدعوة" : "Invited"}</Badge>
      default:
        return <Badge variant="secondary" className="text-[10px]">{status}</Badge>
    }
  }

  let runningIndex = 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden p-0 max-w-xl rounded-2xl border bg-card/95 backdrop-blur-2xl shadow-2xl gap-0"
      >
        <DialogTitle className="sr-only">
          {isAr ? "البحث السريع في المنصة" : "Quick Search"}
        </DialogTitle>

        {/* Search Header Bar */}
        <div className="flex items-center gap-3 border-b px-4 py-3 bg-muted/20">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAr
                ? "ابحث عن بطل بالاسم أو الرقم، أو نموذج، أو صفحة... (⌘K)"
                : "Search athlete by name/phone, template, or page... (⌘K)"
            }
            className="flex-1 bg-transparent text-base sm:text-sm font-medium outline-none placeholder:text-muted-foreground/70"
          />
          {loading && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-semibold text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-4 divide-y divide-border/40">
          {/* Section: Athletes */}
          {clients.length > 0 && (
            <div className="pt-2 first:pt-0 space-y-1">
              <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="size-3 text-brand-600 dark:text-brand-400" />
                <span>{isAr ? "الأبطال" : "Athletes"}</span>
              </div>
              {clients.map((client) => {
                const currentIndex = runningIndex++
                const isSelected = selectedIndex === currentIndex
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelect(currentIndex)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-start text-sm transition-colors",
                      isSelected
                        ? "bg-brand-500/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                        : "hover:bg-muted/60 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-xs font-bold text-brand-700 dark:text-brand-300">
                        {client.fullName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold leading-tight truncate">{client.fullName}</p>
                        {client.phone && (
                          <p className="text-xs text-muted-foreground tabular-nums dir-ltr">{client.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(client.status)}
                      {isSelected && (
                        isAr ? <ArrowLeft className="size-3.5 text-brand-600" /> : <ArrowRight className="size-3.5 text-brand-600" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Section: Templates */}
          {templates.length > 0 && (
            <div className="pt-2 first:pt-0 space-y-1">
              <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Dumbbell className="size-3 text-muscle-500" />
                <span>{isAr ? "النماذج والبرامج" : "Templates"}</span>
              </div>
              {templates.map((tpl) => {
                const currentIndex = runningIndex++
                const isSelected = selectedIndex === currentIndex
                return (
                  <button
                    key={`${tpl.type}-${tpl.id}`}
                    type="button"
                    onClick={() => handleSelect(currentIndex)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-start text-sm transition-colors",
                      isSelected
                        ? "bg-brand-500/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                        : "hover:bg-muted/60 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        {tpl.type === "split" ? (
                          <Dumbbell className="size-3.5 text-muscle-500" />
                        ) : (
                          <Apple className="size-3.5 text-energy-600" />
                        )}
                      </div>
                      <p className="font-semibold leading-tight truncate">{tpl.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {tpl.detail && (
                        <span className="text-xs text-muted-foreground">{tpl.detail}</span>
                      )}
                      {isSelected && (
                        isAr ? <ArrowLeft className="size-3.5 text-brand-600" /> : <ArrowRight className="size-3.5 text-brand-600" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Section: Quick Nav & Shortcuts */}
          {filteredNav.length > 0 && (
            <div className="pt-2 first:pt-0 space-y-1">
              <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {isAr ? "الوصول السريع" : "Quick Actions & Navigation"}
              </div>
              {filteredNav.map((item) => {
                const currentIndex = runningIndex++
                const isSelected = selectedIndex === currentIndex
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelect(currentIndex)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-start text-sm transition-colors",
                      isSelected
                        ? "bg-brand-500/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                        : "hover:bg-muted/60 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="size-3.5" />
                      </div>
                      <span className="font-medium">{isAr ? item.labelAr : item.labelEn}</span>
                    </div>
                    {isSelected && (
                      isAr ? <ArrowLeft className="size-3.5 text-brand-600" /> : <ArrowRight className="size-3.5 text-brand-600" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Empty Search Result */}
          {query.trim() !== "" && !loading && clients.length === 0 && templates.length === 0 && filteredNav.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {isAr ? "لا توجد نتائج تطابق بحثك" : "No results found"}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t px-4 py-2 bg-muted/10 text-[11px] text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ {isAr ? "للتنقل" : "to navigate"}</span>
            <span>↵ {isAr ? "للاختيار" : "to select"}</span>
          </div>
          <span>ESC {isAr ? "للإغلاق" : "to close"}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
