import Link from "next/link"
import { ArrowLeft, CircleAlert, Siren, Info } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getNeedsAction } from "@/server/services/needs-action.service"
import type { NeedActionItem } from "@/lib/needs-action"
import { getI18n } from "@/lib/i18n"
import { formatDate, interpolate } from "@/lib/i18n/format"
import type { Locale } from "@/lib/i18n/config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type T = Awaited<ReturnType<typeof getI18n>>["t"]

function actionText(item: NeedActionItem, t: T): string {
  const name = item.clientName ?? "—"
  switch (item.kind) {
    case "inactive_5d":
      return item.days === null
        ? interpolate(t.needsAction.inactive5dNever, { name })
        : interpolate(t.needsAction.inactive5d, { name, n: item.days })
    case "inactive_3d":
      return interpolate(t.needsAction.inactive3d, { name, n: item.days ?? 0 })
    case "sub_expired":
      return interpolate(t.needsAction.subExpired, { name })
    case "sub_expiring":
      return interpolate(t.needsAction.subExpiring, { name, n: item.days ?? 0 })
    case "no_inbody":
      return interpolate(t.needsAction.noInbody, { name })
    case "payment_pending":
      return interpolate(t.needsAction.paymentPending, { name, n: item.count ?? 0 })
    case "missed_checkin":
      return interpolate(t.needsAction.missedCheckin, { name })
    case "checkin_today":
      return interpolate(t.needsAction.checkinToday, { name })
    case "media_pending":
      return interpolate(t.needsAction.mediaPending, { name, n: item.count ?? 0 })
    case "goal_deadline":
      return interpolate(t.needsAction.goalDeadline, {
        name,
        title: item.title ?? "",
        n: item.days ?? 0,
      })
  }
}

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

export async function NeedsActionSection() {
  const { t, locale } = await getI18n()
  const session = await getCurrentSession()
  const trainerProfileId = session?.user.trainerProfileId
  if (!trainerProfileId) return null

  let summary: Awaited<ReturnType<typeof getNeedsAction>>
  try {
    summary = await getNeedsAction(trainerProfileId)
  } catch (err) {
    console.error("[needs-action] failed to load", err)
    return null
  }

  const { items, counts } = summary

  return (
    <Card className="overflow-hidden border bg-card shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b bg-gradient-to-r from-brand-500/[0.05] to-transparent py-4">
        <CardTitle className="text-sm font-bold tracking-tight min-w-0 flex-1">{t.needsAction.title}</CardTitle>
        <div className="flex items-center gap-1.5 shrink-0">
          {counts.HIGH > 0 ? (
            <Badge className="bg-muscle-500 text-white tabular-nums gap-1"><span className="size-1.5 rounded-full bg-white" /> {counts.HIGH}</Badge>
          ) : null}
          {counts.MEDIUM > 0 ? (
            <Badge className="bg-energy-500 text-white tabular-nums gap-1"><span className="size-1.5 rounded-full bg-white" /> {counts.MEDIUM}</Badge>
          ) : null}
          {counts.LOW > 0 ? (
            <Badge className="bg-performance-500 text-white tabular-nums gap-1"><span className="size-1.5 rounded-full bg-white" /> {counts.LOW}</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm font-semibold">{t.needsAction.allCaughtUp}</p>
            <p className="max-w-[36ch] text-xs text-muted-foreground">
              {t.needsAction.allCaughtUpDescription}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item, idx) => (
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
        )}
      </CardContent>
    </Card>
  )
}
