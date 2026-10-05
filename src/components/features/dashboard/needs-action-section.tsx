import Link from "next/link"
import { ArrowLeft, CircleAlert, Siren, Info } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getNeedsAction, type NeedsActionSummary } from "@/server/services/needs-action.service"
import type { NeedActionItem } from "@/lib/needs-action"
import { getI18n } from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/format"
import type { Locale } from "@/lib/i18n/config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { actionText } from "@/components/features/needs-action/action-text"

type T = Awaited<ReturnType<typeof getI18n>>["t"]

function PriorityIcon({ priority }: { priority: NeedActionItem["priority"] }) {
  if (priority === "HIGH") return <Siren className="size-4 text-white" aria-hidden="true" />
  if (priority === "MEDIUM") return <CircleAlert className="size-4 text-white" aria-hidden="true" />
  return <Info className="size-4 text-white" aria-hidden="true" />
}

const PRIORITY_STYLE: Record<NeedActionItem["priority"], string> = {
  HIGH: "bg-gradient-to-br from-muscle-500 to-brand-500",
  MEDIUM: "bg-gradient-to-br from-energy-500 to-brand-500",
  LOW: "bg-gradient-to-br from-performance-500 to-energy-500",
}

const PRIORITY_LABEL: Record<NeedActionItem["priority"], (t: T) => string> = {
  HIGH: (t) => t.needsAction.high,
  MEDIUM: (t) => t.needsAction.medium,
  LOW: (t) => t.needsAction.low,
}

export async function NeedsActionSection({ summary: initialSummary }: { summary?: NeedsActionSummary } = {}) {
  const { t, locale } = await getI18n()
  const isAr = locale === "ar"
  const session = await getCurrentSession()
  const trainerProfileId = session?.user.trainerProfileId
  if (!trainerProfileId) return null

  let summary = initialSummary
  if (!summary) {
    try {
      summary = await getNeedsAction(trainerProfileId)
    } catch (err) {
      console.error("[needs-action] failed to load", err)
      return null
    }
  }

  const { items, counts, clientCount } = summary
  const displayItems = items.slice(0, 8)

  return (
    <Card className="overflow-hidden border bg-card shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b bg-gradient-to-r from-brand-500/[0.05] to-transparent py-4">
        <Link href="/needs-action" className="min-w-0 flex-1 hover:underline">
          <CardTitle className="text-sm font-bold tracking-tight">{t.needsAction.title}</CardTitle>
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          {counts.HIGH > 0 ? (
            <Link href="/needs-action?priority=HIGH">
              <Badge className="bg-muscle-500 text-white tabular-nums gap-1 hover:brightness-110">
                <span className="size-1.5 rounded-full bg-white" /> {counts.HIGH}
              </Badge>
            </Link>
          ) : null}
          {counts.MEDIUM > 0 ? (
            <Link href="/needs-action?priority=MEDIUM">
              <Badge className="bg-energy-500 text-white tabular-nums gap-1 hover:brightness-110">
                <span className="size-1.5 rounded-full bg-white" /> {counts.MEDIUM}
              </Badge>
            </Link>
          ) : null}
          {counts.LOW > 0 ? (
            <Link href="/needs-action?priority=LOW">
              <Badge className="bg-performance-500 text-white tabular-nums gap-1 hover:brightness-110">
                <span className="size-1.5 rounded-full bg-white" /> {counts.LOW}
              </Badge>
            </Link>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm font-semibold">{t.needsAction.allCaughtUp}</p>
            <p className="max-w-[36ch] text-xs text-muted-foreground">
              {t.needsAction.allCaughtUpDescription}
            </p>
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {displayItems.map((item, idx) => (
                <li
                  key={`${item.kind}-${item.clientId}`}
                  className="animate-slide-soft opacity-0"
                  style={{ animationDelay: `${idx * 45}ms`, animationFillMode: "forwards" }}
                >
                  <Link
                    href={item.cta}
                    className="group flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-px hover:shadow-soft hover:border-brand-200 dark:hover:border-brand-900/30"
                  >
                    <span
                      className={`relative flex size-8 shrink-0 items-center justify-center rounded-lg text-white shadow-soft ${PRIORITY_STYLE[item.priority]}`}
                    >
                      {item.priority === "HIGH" && (
                        <span className="absolute -top-0.5 -end-0.5 flex size-2">
                          <span className="absolute inline-flex size-full animate-beacon rounded-full bg-muscle-500 opacity-75" />
                          <span className="relative inline-flex size-2 rounded-full bg-muscle-500" />
                        </span>
                      )}
                      <PriorityIcon priority={item.priority} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block line-clamp-2 text-sm font-medium leading-snug break-words group-hover:text-foreground">
                        {actionText(item, t)}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {PRIORITY_LABEL[item.priority](t)}
                        {item.at ? ` • ${formatDate(item.at, locale as Locale)}` : ""}
                        {" • "}
                        {t.needsAction.viewClient}
                      </span>
                    </span>
                    <ArrowLeft className="size-4 shrink-0 text-muted-foreground rtl:-scale-x-100 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3.5 flex items-center justify-between border-t pt-3">
              <Link
                href="/needs-action"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
              >
                <span>
                  {isAr
                    ? `عرض التقرير الكامل (${clientCount} عميل)`
                    : `View full report (${clientCount} clients)`}
                </span>
                <ArrowLeft className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
