import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { Button } from "@/components/ui/button"
import { SubscriptionPlanForm } from "@/components/features/subscription-plan/plan-form"
import { getI18n } from "@/lib/i18n"

export default async function NewSubscriptionPlanPage() {
  const { t } = await getI18n()
  const session = await getCurrentSession()

  if (
    !session?.user ||
    session.user.role !== "COACH" ||
    !session.user.trainerProfileId
  ) {
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
          {t.subscriptionPlans.newTitle}
        </h1>
        <p className="text-muted-foreground">{t.subscriptionPlans.subtitle}</p>
      </div>

      <SubscriptionPlanForm />
    </div>
  )
}
