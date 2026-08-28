import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getI18n } from "@/lib/i18n"
import { getCurrentSession } from "@/server/auth"
import { getOwnedClient } from "@/server/services/subscription.service"
import { getTrainerSubscriptionPlans } from "@/server/services/subscription-plan.service"
import { Button } from "@/components/ui/button"
import { AssignPlanPicker } from "@/components/features/subscription/assign-plan-picker"

interface NewSubscriptionPageProps {
  params: Promise<{ id: string }>
}

export default async function NewSubscriptionPage({
  params,
}: NewSubscriptionPageProps) {
  const { t } = await getI18n()
  const session = await getCurrentSession()

  if (
    !session?.user ||
    session.user.role !== "TRAINER" ||
    !session.user.trainerProfileId
  ) {
    notFound()
  }

  const { id } = await params
  const [client, plans] = await Promise.all([
    getOwnedClient(id, session.user.trainerProfileId),
    getTrainerSubscriptionPlans(session.user.trainerProfileId),
  ])

  if (!client) {
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
        <Link href={`/clients/${id}?tab=subscription`}>
          <ArrowLeft className="size-4 rtl:-scale-x-100" />
          {t.subscription.backToSubscription}
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.subscription.assignPageTitle}
        </h1>
        <p className="text-muted-foreground">
          {t.subscription.assignPageSubtitle}
        </p>
      </div>

      <AssignPlanPicker
        clientId={client.id}
        clientName={client.fullName ?? ""}
        plans={plans}
      />
    </div>
  )
}
