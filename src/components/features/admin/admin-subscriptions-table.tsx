"use client"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useI18n } from "@/lib/i18n/client"
import { formatDate } from "@/lib/i18n/format"
import {
  formatPlanSize,
  getPaymentStatusLabel,
  getSubscriptionStatusLabel,
} from "@/lib/i18n/labels"
import {
  SUBSCRIPTION_STATUS_BADGE_VARIANTS,
} from "@/lib/constants"
import type { getAdminSubscriptions } from "@/server/services/admin.service"

const PAYMENT_BADGE_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PAID: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  NOT_REQUIRED: "outline",
}

export function AdminSubscriptionsTable({
  subscriptions,
}: {
  subscriptions: Awaited<ReturnType<typeof getAdminSubscriptions>>["subscriptions"]
}) {
  const { t, locale } = useI18n()
  const c = t.admin.subscriptions.columns

  if (subscriptions.length === 0) {
    return <div className="py-10" />
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {subscriptions.map((subscription) => (
          <div
            key={subscription.id}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="truncate font-medium">
                {subscription.client.fullName}
              </span>
              <span className="shrink-0 ms-2 text-xs text-muted-foreground">
                {subscription.client.trainer?.fullName ?? "—"}
              </span>
            </div>

            <p className="mb-2 text-sm font-medium">{subscription.planName}</p>

            <div className="mb-2 flex flex-wrap gap-1">
              <Badge
                variant={
                  SUBSCRIPTION_STATUS_BADGE_VARIANTS[subscription.status]
                }
              >
                {getSubscriptionStatusLabel(subscription.status, locale)}
              </Badge>
              <Badge variant={PAYMENT_BADGE_VARIANTS[subscription.paymentStatus]}>
                {getPaymentStatusLabel(subscription.paymentStatus, locale)}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatPlanSize(subscription, locale)}</span>
              <span>{formatDate(subscription.startDate, locale)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{c.client}</TableHead>
              <TableHead>{c.trainer}</TableHead>
              <TableHead>{c.plan}</TableHead>
              <TableHead>{c.status}</TableHead>
              <TableHead>{c.payment}</TableHead>
              <TableHead>{c.sessions}</TableHead>
              <TableHead>{c.startDate}</TableHead>
              <TableHead>{c.endDate}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell>
                  <span className="font-medium">
                    {subscription.client.fullName}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {subscription.client.trainer?.fullName ?? "—"}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{subscription.planName}</span>
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
                  <Badge variant={PAYMENT_BADGE_VARIANTS[subscription.paymentStatus]}>
                    {getPaymentStatusLabel(subscription.paymentStatus, locale)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatPlanSize(subscription, locale)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(subscription.startDate, locale)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(subscription.endDate, locale)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
