import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { checkSubscriptionStatus } from "@/server/services/subscription-guard.service"
import { getCoachBranding, DEFAULT_BRANDING } from "@/server/services/branding.service"
import { BrandingProvider } from "@/components/branding/branding-provider"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { TRAINER_NAV_ITEMS } from "@/components/layout/nav-items"
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
  const branding = brandingRaw
    ? { brandName: brandingRaw.effective.brandName, logoUrl: brandingRaw.effective.logoUrl, primaryColor: brandingRaw.effective.primaryColor, coachId: session.user.trainerProfileId ?? null }
    : { brandName: DEFAULT_BRANDING.brandName, logoUrl: DEFAULT_BRANDING.logoUrl, primaryColor: DEFAULT_BRANDING.primaryColor, coachId: null }

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
        <AppSidebar
          name={session.user.name ?? "Trainer"}
          role={session.user.role}
          items={TRAINER_NAV_ITEMS}
          homeHref="/dashboard"
        />
        <main id="main-content" tabIndex={-1} className="scroll-mt-16 md:ms-[272px] outline-none">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </BrandingProvider>
  )
}
