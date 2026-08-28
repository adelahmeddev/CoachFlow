import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { getCurrentSession } from "@/server/auth"
import { getClientProfile } from "@/server/services/client-profile.service"
import { parseClientProfileTab } from "@/lib/validations/client-profile"
import { DEFAULT_CLIENT_PROFILE_TAB, type ClientProfileTab } from "@/lib/constants/client-profile-tabs"
import { ClientProfileHeader } from "@/components/features/clients/client-profile-header"
import { ClientProfileTabs } from "@/components/features/clients/client-profile-tabs"
import { OverviewTab } from "@/components/features/clients/tabs/overview-tab"
import { BodyCompositionTab } from "@/components/features/clients/tabs/body-composition-tab"
import { NutritionTab } from "@/components/features/clients/tabs/nutrition-tab"
import { TrainingSplitTab } from "@/components/features/clients/tabs/training-split-tab"
import { ProgressTab } from "@/components/features/clients/tabs/progress-tab"
import { SubscriptionTab } from "@/components/features/clients/tabs/subscription-tab"

interface ClientProfilePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ClientProfilePage({
  params,
  searchParams,
}: ClientProfilePageProps) {
  const session = await getCurrentSession()

  if (
    !session?.user ||
    (session.user.role !== "TRAINER" && session.user.role !== "ADMIN") ||
    (session.user.role === "TRAINER" && !session.user.trainerProfileId)
  ) {
    notFound()
  }

  const { id } = await params
  const { tab } = await searchParams
  const activeTab = parseClientProfileTab(tab) ?? DEFAULT_CLIENT_PROFILE_TAB

  const trainerProfileId =
    session.user.role === "ADMIN" ? undefined : session.user.trainerProfileId

  const profile = await getClientProfile(id, trainerProfileId ?? "")

  if (!profile) {
    notFound()
  }

  const tabsContent: Record<ClientProfileTab, ReactNode> = {
    overview: <OverviewTab clientId={id} profile={profile} />,
    "body-composition": <BodyCompositionTab clientId={id} />,
    nutrition: <NutritionTab clientId={id} />,
    "training-split": <TrainingSplitTab clientId={id} />,
    progress: <ProgressTab clientId={id} />,
    subscription: <SubscriptionTab clientId={id} />,
  }

  return (
    <div className="space-y-6">
      <ClientProfileHeader profile={profile} />
      <ClientProfileTabs clientId={id} activeTab={activeTab} tabsContent={tabsContent} />
    </div>
  )
}
