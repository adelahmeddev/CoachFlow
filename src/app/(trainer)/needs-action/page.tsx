import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Siren,
  CircleAlert,
  Info,
  Users,
  CheckCircle2,
  ArrowLeft,
  X,
  ExternalLink,
} from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getNeedsAction } from "@/server/services/needs-action.service"
import {
  NEED_ACTION_KINDS,
  type ActionPriority,
  type NeedActionItem,
  type NeedActionKind,
} from "@/lib/needs-action"
import { getI18n } from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/format"
import type { Locale } from "@/lib/i18n/config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { actionText, getKindBadgeLabel } from "@/components/features/needs-action/action-text"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return {
    title: t.needsAction.title,
    description: t.needsAction.subtitle,
  }
}

const VALID_PRIORITIES = new Set<ActionPriority>(["HIGH", "MEDIUM", "LOW"])
const VALID_KINDS = new Set<string>(NEED_ACTION_KINDS)

const PRIORITY_STYLE: Record<ActionPriority, { border: string; bg: string; text: string; badge: string }> = {
  HIGH: {
    border: "border-muscle-200 dark:border-muscle-800/40",
    bg: "bg-muscle-500/10",
    text: "text-muscle-600 dark:text-muscle-400",
    badge: "bg-muscle-500 text-white",
  },
  MEDIUM: {
    border: "border-energy-200 dark:border-energy-800/40",
    bg: "bg-energy-500/10",
    text: "text-energy-600 dark:text-energy-400",
    badge: "bg-energy-500 text-white",
  },
  LOW: {
    border: "border-performance-200 dark:border-performance-800/40",
    bg: "bg-performance-500/10",
    text: "text-performance-600 dark:text-performance-400",
    badge: "bg-performance-500 text-white",
  },
}

export default async function NeedsActionPage({
  searchParams,
}: {
  searchParams: Promise<{ priority?: string; kind?: string }>
}) {
  const { t, locale } = await getI18n()
  const isAr = locale === "ar"
  const session = await getCurrentSession()
  const trainerProfileId = session?.user.trainerProfileId

  if (!trainerProfileId) {
    redirect("/dashboard")
  }

  const rawParams = await searchParams
  const selectedPriority =
    rawParams.priority && VALID_PRIORITIES.has(rawParams.priority as ActionPriority)
      ? (rawParams.priority as ActionPriority)
      : undefined
  const selectedKind =
    rawParams.kind && VALID_KINDS.has(rawParams.kind)
      ? (rawParams.kind as NeedActionKind)
      : undefined

  const summary = await getNeedsAction(trainerProfileId)

  // Filter items based on active selections
  let filteredItems = summary.items
  if (selectedPriority) {
    filteredItems = filteredItems.filter((item) => item.priority === selectedPriority)
  }
  if (selectedKind) {
    filteredItems = filteredItems.filter((item) => item.kind === selectedKind)
  }

  // Group by client
  const clientGroups = new Map<
    string,
    {
      clientId: string
      clientName: string | null
      items: NeedActionItem[]
      highestPriority: ActionPriority
      lastActivity: string | null
    }
  >()

  const rank: Record<ActionPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

  for (const item of filteredItems) {
    const existing = clientGroups.get(item.clientId)
    if (!existing) {
      clientGroups.set(item.clientId, {
        clientId: item.clientId,
        clientName: item.clientName,
        items: [item],
        highestPriority: item.priority,
        lastActivity: item.at,
      })
    } else {
      existing.items.push(item)
      if (rank[item.priority] < rank[existing.highestPriority]) {
        existing.highestPriority = item.priority
      }
      if (!existing.lastActivity && item.at) {
        existing.lastActivity = item.at
      }
    }
  }

  const sortedClients = Array.from(clientGroups.values()).sort(
    (a, b) => rank[a.highestPriority] - rank[b.highestPriority]
  )

  const hasFilters = Boolean(selectedPriority) || Boolean(selectedKind)

  const buildUrl = (p?: string, k?: string) => {
    const params = new URLSearchParams()
    if (p) params.set("priority", p)
    if (k) params.set("kind", k)
    const qs = params.toString()
    return qs ? `/needs-action?${qs}` : "/needs-action"
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex size-8 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-muted"
            >
              <ArrowLeft className="size-4 rtl:-scale-x-100" />
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {isAr ? "تقرير المتابعة والعملاء" : "Needs Follow-up Report"}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground ps-10">
            {isAr
              ? `إجمالي ${summary.clientCount} عميل بحاجة إلى انتباه ومتابعة`
              : `${summary.clientCount} athletes currently need attention or follow-up`}
          </p>
        </div>

        {hasFilters && (
          <Button asChild variant="ghost" size="sm" className="gap-1.5 self-start sm:self-auto">
            <Link href="/needs-action">
              <X className="size-3.5" />
              {t.clients.clearFilters}
            </Link>
          </Button>
        )}
      </div>

      {/* Priority Cards (Toggleable) */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(["HIGH", "MEDIUM", "LOW"] as const).map((priority) => {
          const isSelected = selectedPriority === priority
          const targetUrl = isSelected
            ? buildUrl(undefined, selectedKind)
            : buildUrl(priority, selectedKind)
          const count = summary.counts[priority]
          const label =
            priority === "HIGH"
              ? t.needsAction.high
              : priority === "MEDIUM"
                ? t.needsAction.medium
                : t.needsAction.low
          const Icon = priority === "HIGH" ? Siren : priority === "MEDIUM" ? CircleAlert : Info

          return (
            <Link key={priority} href={targetUrl} className="block group">
              <Card
                className={cn(
                  "border bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5",
                  isSelected
                    ? "ring-2 ring-brand-500 border-brand-500 shadow-md"
                    : "hover:border-brand-200 dark:hover:border-brand-800"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg",
                        PRIORITY_STYLE[priority].bg,
                        PRIORITY_STYLE[priority].text
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {label}
                    </span>
                  </div>
                  <Badge
                    className={cn(
                      "tabular-nums text-sm font-bold",
                      count > 0 ? PRIORITY_STYLE[priority].badge : "bg-muted text-muted-foreground"
                    )}
                  >
                    {count}
                  </Badge>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Reason / Kind Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground me-1">
          {isAr ? "تصفية حسب السبب:" : "Filter by reason:"}
        </span>
        {NEED_ACTION_KINDS.map((kind) => {
          const count = summary.countsByKind[kind] ?? 0
          if (count === 0 && selectedKind !== kind) return null
          const isSelected = selectedKind === kind
          const targetUrl = isSelected
            ? buildUrl(selectedPriority, undefined)
            : buildUrl(selectedPriority, kind)

          return (
            <Link key={kind} href={targetUrl}>
              <Badge
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "h-7 gap-1.5 px-2.5 text-xs font-normal cursor-pointer transition-colors",
                  isSelected
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "hover:bg-muted"
                )}
              >
                <span>{getKindBadgeLabel(kind, isAr)}</span>
                <span className="rounded-full bg-black/10 dark:bg-white/10 px-1 text-[11px] font-semibold">
                  {count}
                </span>
                {isSelected && <X className="size-3 ms-0.5" />}
              </Badge>
            </Link>
          )
        })}
      </div>

      {/* Client-Grouped List */}
      {sortedClients.length === 0 ? (
        <Card className="border bg-card p-12 text-center shadow-soft">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-performance-500/10 text-performance-600 mb-3">
            <CheckCircle2 className="size-6" />
          </div>
          <h2 className="text-lg font-bold">{t.needsAction.allCaughtUp}</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-[40ch] mx-auto">
            {hasFilters
              ? isAr
                ? "لا توجد نتائج تطابق التصفية الحالية."
                : "No clients match the active filters."
              : t.needsAction.allCaughtUpDescription}
          </p>
          {hasFilters && (
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/needs-action">{t.clients.clearFilters}</Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedClients.map((group) => {
            return (
              <Card
                key={group.clientId}
                className={cn(
                  "overflow-hidden border bg-card shadow-soft transition-all duration-150 hover:shadow-md",
                  PRIORITY_STYLE[group.highestPriority].border
                )}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Client info */}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/clients/${group.clientId}`}
                          className="text-base font-bold text-foreground hover:text-brand-600 hover:underline flex items-center gap-1.5"
                        >
                          <span>{group.clientName ?? "—"}</span>
                          <ExternalLink className="size-3.5 text-muted-foreground" />
                        </Link>
                        {group.lastActivity && (
                          <span className="text-xs text-muted-foreground">
                            • {isAr ? "آخر نشاط:" : "Last activity:"}{" "}
                            {formatDate(group.lastActivity, locale as Locale)}
                          </span>
                        )}
                      </div>

                      {/* Items for this client */}
                      <ul className="space-y-1.5 pt-1">
                        {group.items.map((item) => (
                          <li
                            key={`${item.kind}-${item.clientId}`}
                            className="flex flex-wrap items-center gap-2 text-sm"
                          >
                            <Badge
                              className={cn(
                                "text-[11px] px-1.5 py-0.5 font-semibold",
                                PRIORITY_STYLE[item.priority].badge
                              )}
                            >
                              {item.priority === "HIGH"
                                ? isAr ? "عاجل" : "High"
                                : item.priority === "MEDIUM"
                                  ? isAr ? "متوسط" : "Medium"
                                  : isAr ? "منخفض" : "Low"}
                            </Badge>
                            <span className="font-medium text-foreground">
                              {actionText(item, t)}
                            </span>
                            <Link
                              href={item.cta}
                              className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400 inline-flex items-center gap-0.5"
                            >
                              <span>{t.needsAction.viewClient}</span>
                              <ArrowLeft className="size-3 rtl:-scale-x-100" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Quick Profile CTA */}
                    <div className="shrink-0 flex items-center gap-2">
                      <Button asChild size="sm" variant="outline" className="rounded-xl">
                        <Link href={`/clients/${group.clientId}`}>
                          <Users className="size-3.5 me-1.5" />
                          {isAr ? "الملف الشخصي" : "Profile"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
