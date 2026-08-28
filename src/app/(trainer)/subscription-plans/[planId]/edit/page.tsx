import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getSubscriptionPlanForEdit } from "@/server/services/subscription-plan.service"
import { Button } from "@/components/ui/button"
import { SubscriptionPlanForm } from "@/components/features/subscription-plan/plan-form"
import { getI18n } from "@/lib/i18n"

interface EditSubscriptionPlanPageProps {
  params: Promise<{ planId: string }>
}

export default async function EditSubscriptionPlanPage({
  params,
}: EditSubscriptionPlanPageProps) {
  const { t } = await getI18n()
  const session = await getCurrentSession()

  if (
    !session?.user ||
    session.user.role !== "TRAINER" ||
    !session.user.trainerProfileId
  ) {
    notFound()
  }

  const { planId } = await params
  const plan = await getSubscriptionPlanForEdit(
    planId,
    session.user.trainerProfileId
  )

  if (!plan) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="gap-2 ps-0 text-muted-foreground"
      >
        <Link href="/subscription-plans">
          <ArrowLeft className="size-4 rtl:-scale-x-100" />
          {t.subscriptionPlans.backToList}
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.subscriptionPlans.editTitle}
        </h1>
        <p className="text-muted-foreground">{plan.name}</p>
      </div>

      <SubscriptionPlanForm plan={plan} />
    </div>
  )
}
