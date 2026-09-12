import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { checkSubscriptionStatus } from "@/server/services/subscription-guard.service"
import { getCoachBranding, toBranding } from "@/server/services/branding.service"
import { BrandingProvider } from "@/components/branding/branding-provider"
import { AppTopNav } from "@/components/layout/app-top-nav"
import { SubscriptionExpiredView } from "@/components/features/subscription/subscription-expired-view"

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== "COACH") {
    redirect("/login")
  }

  // Tenant-isolated branding (no global cache) — per coachId
  const brandingRaw = session.user.trainerProfileId
    ? await getCoachBranding(session.user.trainerProfileId)
    : null
  const branding = toBranding(brandingRaw, session.user.trainerProfileId)

  // Centralized guard — blocked coaches see expired screen but data stays intact
  if (session.user.trainerProfileId) {
    const subStatus = await checkSubscriptionStatus(session.user.trainerProfileId)
    
    if (!subStatus.hasActiveSubscription) {
      return (
        <BrandingProvider branding={branding}>
          <div className="min-h-dvh bg-background">
            <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
              <SubscriptionExpiredView
                status={subStatus.status}
                endDate={subStatus.endDate}
                daysRemaining={subStatus.daysRemaining}
              />
            </main>
          </div>
        </BrandingProvider>
      )
    }
  }

  return (
    <BrandingProvider branding={branding}>
      <div className="min-h-dvh bg-background">
        <AppTopNav
          name={session.user.name ?? "Trainer"}
          role={session.user.role}
          homeHref="/dashboard"
        />
        <main id="main-content" tabIndex={-1} className="scroll-mt-16 outline-none">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </BrandingProvider>
  )
}
