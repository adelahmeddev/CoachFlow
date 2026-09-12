import Link from "next/link"
import { CalendarCheck2 } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getCoachCheckinOverview } from "@/server/services/checkin.service"
import { getI18n } from "@/lib/i18n"
import { formatDate, interpolate } from "@/lib/i18n/format"
import type { Locale } from "@/lib/i18n/config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export async function CheckinOverviewCard() {
  const { t, locale } = await getI18n()
  const session = await getCurrentSession()
  const trainerProfileId = session?.user.trainerProfileId
  if (!trainerProfileId) return null

  let overview: Awaited<ReturnType<typeof getCoachCheckinOverview>>
  try {
    overview = await getCoachCheckinOverview(trainerProfileId)
  } catch (err) {
    console.error("[checkin-overview] failed to load", err)
    return null
  }

  const total = overview.checkedInToday.length + overview.missing.length
  if (total === 0) return null

  return (
    <Card className="border bg-card shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b bg-gradient-to-r from-performance-500/[0.05] to-transparent py-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-performance-500 to-brand-500 text-white shadow-soft">
            <CalendarCheck2 className="size-4" />
          </span>
          <CardTitle className="text-sm font-bold tracking-tight">{t.checkin.todayTitle}</CardTitle>
        </div>
        <Badge variant="outline" className="tabular-nums shrink-0">
          {overview.checkedInToday.length}/{total}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {overview.missing.length === 0 ? (
          <p className="py-2 text-center text-sm font-medium">{t.checkin.allDone}</p>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t.checkin.missing} ({overview.missing.length})
            </p>
            <ul className="max-h-56 space-y-1.5 overflow-y-auto">
              {overview.missing.slice(0, 10).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/clients/${c.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:border-brand-300 hover:bg-muted/40"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">{c.fullName ?? "—"}</span>
                    <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">
                      {c.lastCheckIn
                        ? interpolate(t.checkin.lastCheckin, {
                            date: formatDate(`${c.lastCheckIn}T00:00:00Z`, locale as Locale),
                          })
                        : t.checkin.never}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {overview.checkedInToday.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {overview.checkedInToday.slice(0, 12).map((c) => (
              <Link key={c.id} href={`/clients/${c.id}`}>
                <Badge variant="secondary" className="gap-1">
                  <span className="size-1.5 rounded-full bg-performance-500" />
                  {c.fullName ?? "—"}
                </Badge>
              </Link>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
