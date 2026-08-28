import Link from "next/link"
import { Pencil } from "lucide-react"
import type { Subscription } from "@/generated/prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getI18n } from "@/lib/i18n"
import { formatDate, interpolate } from "@/lib/i18n/format"
import {
  formatPlanSize,
  getPaymentStatusLabel,
  getPlanTypeLabel,
  getSubscriptionStatusLabel,
} from "@/lib/i18n/labels"
import {
  SUBSCRIPTION_STATUS_BADGE_VARIANTS,
  PAYMENT_STATUS_BADGE_VARIANTS,
  PLAN_TYPE_BADGE_VARIANTS,
} from "@/lib/constants/subscription"
import { cn } from "@/lib/utils"
import { StatusActionButtons } from "@/components/features/subscription/status-action-buttons"
import { RenewSubscriptionDialog } from "@/components/features/subscription/renew-subscription-dialog"
import { UseSessionButton } from "@/components/features/subscription/use-session-button"

interface CurrentSubscriptionCardProps {
  subscription: Subscription
  clientId: string
}

function sessionPercentage(
  remaining: number | null,
  total: number | null
): number {
  if (remaining === null || total === null || total <= 0) return 0
  return Math.round((remaining / total) * 100)
}

function progressColor(
  remaining: number | null,
  total: number | null
): "default" | "warning" | "danger" {
  if (remaining === null || total === null || total <= 0) return "default"
  if (remaining <= 0) return "danger"
  if (remaining <= Math.round(total * 0.2)) return "warning"
  return "default"
}

const DAY_MS = 24 * 60 * 60 * 1000

export async function CurrentSubscriptionCard({
  subscription,
  clientId,
}: CurrentSubscriptionCardProps) {
  const { t, locale } = await getI18n()
  const isSessions = subscription.planType === "SESSIONS"
  const { remainingSessions, sessionsCount, durationDays, startDate, endDate } =
    subscription

  let pct = 0
  let color: "default" | "warning" | "danger" = "default"
  let progressLabel: string | null = null

  if (isSessions) {
    pct = sessionPercentage(remainingSessions, sessionsCount)
    color = progressColor(remainingSessions, sessionsCount)
    if (sessionsCount !== null && sessionsCount > 0) {
      progressLabel = interpolate(t.subscription.sessionsProgress, {
        remaining: remainingSessions ?? 0,
        total: sessionsCount,
      })
    }
  } else if (startDate && endDate && durationDays) {
    const totalMs = endDate.getTime() - startDate.getTime()
    const now = new Date()
    const leftMs = Math.max(0, endDate.getTime() - now.getTime())
    const daysLeft = Math.ceil(leftMs / DAY_MS)
    pct = totalMs > 0 ? Math.round((leftMs / totalMs) * 100) : 0
    color = progressColor(daysLeft, durationDays)
    progressLabel = `${interpolate(t.subscription.summaryPeriodDays, { total: durationDays })} · ${interpolate(t.subscription.daysLeft, { days: daysLeft })}`
  }

  const endDatePassed =
    (subscription.status === "ACTIVE" || subscription.status === "TRIAL") &&
    subscription.endDate !== null &&
    subscription.endDate < new Date()

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{subscription.planName}</CardTitle>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={PLAN_TYPE_BADGE_VARIANTS[subscription.planType]}>
              {getPlanTypeLabel(subscription.planType, locale)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatPlanSize(subscription, locale)}
            </span>
            <Badge
              variant={SUBSCRIPTION_STATUS_BADGE_VARIANTS[subscription.status]}
            >
              {getSubscriptionStatusLabel(subscription.status, locale)}
            </Badge>
            <Badge
              variant={PAYMENT_STATUS_BADGE_VARIANTS[subscription.paymentStatus]}
            >
              {getPaymentStatusLabel(subscription.paymentStatus, locale)}
            </Badge>
            {subscription.autoRenew ? (
              <Badge variant="secondary">{t.subscription.autoRenew}</Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {endDatePassed ? (
          <Alert>
            <AlertDescription>{t.subscription.expiredWarning}</AlertDescription>
          </Alert>
        ) : null}

        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <InfoItem
            label={t.subscription.startDate}
            value={formatDate(subscription.startDate, locale)}
          />
          <InfoItem
            label={t.subscription.endDate}
            value={formatDate(subscription.endDate, locale)}
          />
          {isSessions ? (
            <>
              <InfoItem
                label={t.subscription.sessionsCount}
                value={subCount(sessionsCount)}
              />
              <InfoItem
                label={t.subscription.remainingSessions}
                value={subCount(remainingSessions)}
              />
            </>
          ) : (
            <InfoItem
              label={t.subscription.durationDays}
              value={subCount(durationDays ?? null)}
            />
          )}
        </dl>

        {progressLabel ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progressLabel}</span>
              <span>{pct}%</span>
            </div>
            <Progress
              value={pct}
              className={cn(
                color === "warning" && "bg-amber-100 [&>div]:bg-amber-500",
                color === "danger" &&
                  "bg-red-100 [&>div]:bg-red-500 dark:bg-red-500/20 dark:[&>div]:bg-red-500"
              )}
            />
          </div>
        ) : null}

        {subscription.notes ? (
          <p className="text-sm text-muted-foreground">{subscription.notes}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/clients/${clientId}/subscription/${subscription.id}/edit`}
            >
              <Pencil className="size-3.5" />
              {t.common.edit}
            </Link>
          </Button>
          <RenewSubscriptionDialog
            clientId={clientId}
            subscriptionId={subscription.id}
            planType={subscription.planType}
          />
          {isSessions && sessionsCount !== null && (remainingSessions ?? 0) > 0 ? (
            <UseSessionButton
              clientId={clientId}
              subscriptionId={subscription.id}
            />
          ) : null}
          <StatusActionButtons
            clientId={clientId}
            subscriptionId={subscription.id}
            status={subscription.status}
            className="ms-auto flex flex-wrap items-center gap-2"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

function subCount(value: number | null): string {
  return value === null ? "—" : String(value)
}
