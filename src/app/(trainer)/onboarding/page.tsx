import { getCurrentSession } from "@/server/auth"
import { getTrainerInvites } from "@/server/services/invite.service"
import { JoinLinkCard } from "@/components/features/onboarding/join-link-card"
import { InviteList } from "@/components/features/onboarding/invite-list"
import { getI18n } from "@/lib/i18n"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return {
    title: t.onboarding.title,
    description: t.onboarding.description,
  }
}

export default async function OnboardingPage() {
  const { t } = await getI18n()
  const session = await getCurrentSession()
  // Handle missing/stale trainerProfileId (e.g., after DB reset with old JWT)
  let trainerProfileId = session?.user.trainerProfileId
  if (session?.user.role === "TRAINER" && !trainerProfileId && session.user.id) {
    const { prisma } = await import("@/lib/prisma")
    const byUser = await prisma.trainerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    trainerProfileId = byUser?.id
  }
  const invites = trainerProfileId ? await getTrainerInvites(trainerProfileId) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.onboarding.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t.onboarding.description}
        </p>
      </div>

      <JoinLinkCard />
      <InviteList invites={invites} />
    </div>
  )
}
