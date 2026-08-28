import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getI18n } from "@/lib/i18n"
import { getCurrentSession } from "@/server/auth"
import {
  getOwnedClient,
  getSubscriptionForEdit,
} from "@/server/services/subscription.service"
import { Button } from "@/components/ui/button"
import { SubscriptionForm } from "@/components/features/subscription/subscription-form"

interface EditSubscriptionPageProps {
  params: Promise<{ id: string; subscriptionId: string }>
}

export default async function EditSubscriptionPage({
  params,
}: EditSubscriptionPageProps) {
  const { t } = await getI18n()
  const session = await getCurrentSession()

  if (
    !session?.user ||
    session.user.role !== "TRAINER" ||
    !session.user.trainerProfileId
  ) {
    notFound()
  }

  const { id, subscriptionId } = await params

  const [client, subscription] = await Promise.all([
    getOwnedClient(id, session.user.trainerProfileId),
    getSubscriptionForEdit(
      id,
      session.user.trainerProfileId,
      subscriptionId
    ),
  ])

  if (!client || !subscription) {
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
          {t.subscription.editPageTitle}
        </h1>
        <p className="text-muted-foreground">
          {client.fullName ?? t.profile.overview.invitedClient}
        </p>
      </div>

      <SubscriptionForm clientId={client.id} subscription={subscription} />
    </div>
  )
}