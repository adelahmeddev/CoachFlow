import Link from "next/link"
import { notFound } from "next/navigation"
import { Plus } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getTrainerSubscriptionPlans } from "@/server/services/subscription-plan.service"
import { Button } from "@/components/ui/button"
import { PlansTable } from "@/components/features/subscription-plan/plans-table"
import { getI18n } from "@/lib/i18n"

export default async function SubscriptionPlansPage() {
  const { t } = await getI18n()
  const session = await getCurrentSession()

  if (
    !session?.user ||
    session.user.role !== "TRAINER" ||
    !session.user.trainerProfileId
  ) {
    notFound()
  }

  const plans = await getTrainerSubscriptionPlans(
    session.user.trainerProfileId
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.subscriptionPlans.title}
          </h1>
          <p className="text-muted-foreground">{t.subscriptionPlans.subtitle}</p>
        </div>
        <Button asChild>
          <Link href="/subscription-plans/new">
            <Plus className="me-1 h-4 w-4" />
            {t.subscriptionPlans.newPlan}
          </Link>
        </Button>
      </div>

      <PlansTable plans={plans} />
    </div>
  )
}
