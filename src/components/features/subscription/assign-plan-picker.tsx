"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { CalendarRange, Loader2, Plus, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/client"
import { formatPlanSize, getPlanTypeLabel } from "@/lib/i18n/labels"
import { assignSubscriptionPlanAction } from "@/server/actions/subscription-plan"
import { PLAN_TYPE_BADGE_VARIANTS } from "@/lib/constants/subscription"
import type { PlanType } from "@/generated/prisma/enums"

export interface AssignablePlanRow {
  id: string
  name: string
  planType: PlanType
  sessionsCount: number | null
  durationDays: number | null
}

interface AssignPlanPickerProps {
  clientId: string
  clientName: string
  plans: AssignablePlanRow[]
}

export function AssignPlanPicker({
  clientId,
  clientName,
  plans,
}: AssignPlanPickerProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [assigningId, setAssigningId] = useState<string | null>(null)

  async function handleAssign(planId: string) {
    setAssigningId(planId)
    try {
      const result = await assignSubscriptionPlanAction(clientId, planId)
      if (!result.ok) {
        toast.error(result.error ?? t.subscription.errors.renewFailed)
        return
      }
      toast.success(t.subscription.assignedToast)
      router.push(`/clients/${clientId}?tab=subscription`)
    } catch (e) {
      const err = e as { digest?: string }
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw e
      }
      toast.error(t.toasts.genericError)
    } finally {
      setAssigningId(null)
    }
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-sm font-semibold">
          {t.subscription.assignEmptyTitle}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.subscription.assignEmptyDescription}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/subscription-plans/new">
            <Plus className="me-1 h-4 w-4" />
            {t.subscriptionPlans.newPlan}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">{clientName}</p>
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
              <div className="flex items-center gap-2 text-sm font-medium">
                {plan.planType === "SESSIONS" ? (
                  <Ticket className="size-4 text-primary" />
                ) : (
                  <CalendarRange className="size-4 text-primary" />
                )}
                {formatPlanSize(plan, locale)}
              </div>

              <Button
                type="button"
                size="sm"
                className="w-full"
                disabled={assigningId !== null}
                onClick={() => handleAssign(plan.id)}
              >
                {assigningId === plan.id ? (
                  <>
                    <Loader2 className="me-1.5 size-3.5 animate-spin" />
                    {t.subscription.assigning}
                  </>
                ) : (
                  t.subscription.assignButton
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
