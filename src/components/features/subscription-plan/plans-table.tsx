"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Copy, Pencil, Trash2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { formatPlanSize, getPlanTypeLabel } from "@/lib/i18n/labels"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  deleteSubscriptionPlanAction,
  duplicateSubscriptionPlanAction,
} from "@/server/actions/subscription-plan"
import { PLAN_TYPE_BADGE_VARIANTS } from "@/lib/constants"
import type { PlanType } from "@/lib/db/enums"

export interface SubscriptionPlanRow {
  id: string
  name: string
  planType: PlanType
  sessionsCount: number | null
  durationDays: number | null
  notes: string | null
}

export function PlansTable({ plans }: { plans: SubscriptionPlanRow[] }) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlanRow | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDuplicate(id: string) {
    setBusyId(id)
    const result = await duplicateSubscriptionPlanAction(id)
    if (!result.ok) {
      toast.error(result.error ?? t.toasts.genericError)
      setBusyId(null)
      return
    }
    toast.success(t.subscriptionPlans.duplicatedToast)
    setBusyId(null)
    router.push(`/subscription-plans/${result.planId}/edit`)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const result = await deleteSubscriptionPlanAction(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)
    if (!result.ok) {
      toast.error(result.error ?? t.subscriptionPlans.deleteFailed)
      return
    }
    toast.success(t.subscriptionPlans.deletedToast)
    router.refresh()
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-sm font-semibold">
          {t.subscriptionPlans.emptyTitle}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.subscriptionPlans.emptyDescription}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/subscription-plans/new">
            {t.subscriptionPlans.newPlan}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0 gap-2">
              <CardTitle className="text-base">{plan.name}</CardTitle>
              <Badge variant={PLAN_TYPE_BADGE_VARIANTS[plan.planType]}>
                {getPlanTypeLabel(plan.planType, locale)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">
                {formatPlanSize(plan, locale)}
              </p>
              {plan.notes ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {plan.notes}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/subscription-plans/${plan.id}/edit`}>
                    <Pencil className="size-3.5" />
                    {t.common.edit}
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyId !== null}
                  onClick={() => handleDuplicate(plan.id)}
                >
                  <Copy className="size-3.5" />
                  {t.subscriptionPlans.duplicate}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={busyId !== null}
                  onClick={() => setDeleteTarget(plan)}
                >
                  <Trash2 className="size-3.5" />
                  {t.common.delete}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.subscriptionPlans.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>
              {t.subscriptionPlans.deleteConfirm}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting || busyId !== null}
              onClick={handleDelete}
            >
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
