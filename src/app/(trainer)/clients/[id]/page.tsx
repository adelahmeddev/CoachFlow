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
    (session.user.role !== "COACH" && session.user.role !== "SUPER_ADMIN") ||
    (session.user.role === "COACH" && !session.user.trainerProfileId)
  ) {
    notFound()
  }

  const { id } = await params
  const { tab } = await searchParams
  const activeTab = parseClientProfileTab(tab) ?? DEFAULT_CLIENT_PROFILE_TAB

  const trainerProfileId =
    session.user.role === "SUPER_ADMIN" ? undefined : session.user.trainerProfileId

  let profile: Awaited<ReturnType<typeof getClientProfile>> | null = null
  try {
    profile = await getClientProfile(id, trainerProfileId ?? "")
  } catch (err) {
    console.error("[ClientProfilePage] failed to load", err)
    // Degraded: show error boundary fallback instead of crashing
    // Return a retryable error UI
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-semibold text-destructive">فشل تحميل بيانات العميل — انتهت مهلة الاتصال</p>
          <p className="mt-1 text-xs text-muted-foreground">تأكد من الاتصال أو حاول تحديث الصفحة. قد تكون قاعدة البيانات في وضع الاستيقاظ (Neon cold start).</p>
          <p className="mt-3 text-xs text-muted-foreground">ClientProfile timeout — DB pooled connection cold start. Retry in a few seconds.</p>
        </div>
      </div>
    )
  }

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
