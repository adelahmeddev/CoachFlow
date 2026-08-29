import Link from "next/link"
import { Pencil, Plus } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getClientSubscriptionData } from "@/server/services/subscription.service"
import type { Subscription } from "@/lib/db/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getI18n } from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/format"
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
} from "@/lib/constants"
import { CurrentSubscriptionCard } from "@/components/features/subscription/current-subscription-card"

interface SubscriptionTabProps {
  clientId: string
}

export async function SubscriptionTab({ clientId }: SubscriptionTabProps) {
  const { t } = await getI18n()

  const session = await getCurrentSession()
  if (
    !session?.user ||
    session.user.role !== "TRAINER" ||
    !session.user.trainerProfileId
  ) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{t.toasts.unauthorized}</p>
      </div>
    )
  }

  const data = await getClientSubscriptionData(
    clientId,
    session.user.trainerProfileId
  )

  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{t.toasts.unauthorized}</p>
      </div>
    )
  }

  const { subscriptions, currentSubscription } = data

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t.subscription.title}
          </h2>
          <p className="text-muted-foreground">{t.subscription.subtitle}</p>
        </div>
        <Button asChild>
          <Link href={`/clients/${clientId}/subscription/new`}>
            <Plus className="me-1.5 h-4 w-4" />
            {t.subscription.assignPlan}
          </Link>
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-sm font-semibold">{t.subscription.emptyTitle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.subscription.emptyDescription}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href={`/clients/${clientId}/subscription/new`}>
              <Plus className="me-1 h-4 w-4" />
              {t.subscription.assignPlan}
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {currentSubscription ? (
            <CurrentSubscriptionCard
              subscription={currentSubscription}
              clientId={clientId}
            />
          ) : null}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t.subscription.history}</h3>
            {subscriptions.length > 0 ? (
              <SubscriptionHistoryTable
                subscriptions={subscriptions}
                clientId={clientId}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

async function SubscriptionHistoryTable({
  subscriptions,
  clientId,
}: {
  subscriptions: Subscription[]
  clientId: string
}) {
  const { t, locale } = await getI18n()
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.subscription.plan}</TableHead>
            <TableHead>{t.subscription.planType}</TableHead>
            <TableHead>{t.subscription.status}</TableHead>
            <TableHead>{t.subscription.payment}</TableHead>
            <TableHead>{t.subscription.startDate}</TableHead>
            <TableHead>{t.subscription.endDate}</TableHead>
            <TableHead className="text-end">{t.common.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell className="font-medium">
                {subscription.planName}
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <Badge variant={PLAN_TYPE_BADGE_VARIANTS[subscription.planType]}>
                    {getPlanTypeLabel(subscription.planType, locale)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatPlanSize(subscription, locale)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    SUBSCRIPTION_STATUS_BADGE_VARIANTS[subscription.status]
                  }
                >
                  {getSubscriptionStatusLabel(subscription.status, locale)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    PAYMENT_STATUS_BADGE_VARIANTS[subscription.paymentStatus]
                  }
                >
                  {getPaymentStatusLabel(subscription.paymentStatus, locale)}
                </Badge>
              </TableCell>
              <TableCell>
                {formatDate(subscription.startDate, locale)}
              </TableCell>
              <TableCell>{formatDate(subscription.endDate, locale)}</TableCell>
              <TableCell className="text-end">
                <Button asChild variant="ghost" size="sm">
                  <Link
                    href={`/clients/${clientId}/subscription/${subscription.id}/edit`}
                  >
                    <Pencil className="size-3.5" />
                    {t.common.edit}
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

