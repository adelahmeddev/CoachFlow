import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { pool } from "@/lib/db"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { CLIENT_NAV_ITEMS } from "@/components/layout/nav-items"
import { NoLongerSubscribedCard } from "@/components/features/client/no-longer-subscribed"
import { getCoachBranding, DEFAULT_BRANDING } from "@/server/services/branding.service"
import { BrandingProvider } from "@/components/branding/branding-provider"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== "CLIENT") {
    redirect("/client/login")
  }

  const userRes = await pool.query(`SELECT "mustChangePassword" FROM "User" WHERE "id" = $1 LIMIT 1`, [session.user.id])
  const user = userRes.rows[0] as { mustChangePassword: boolean } | undefined

  // Account deleted by trainer (hard delete) -> user row no longer exists
  // Show friendly "No longer subscribed" instead of generic 404/redirect loop
  if (!user) {
    return <NoLongerSubscribedCard />
  }

  if (user.mustChangePassword) {
    redirect("/client/change-password")
  }

  // Client record deleted by trainer (soft keep-user case) -> user exists but client link missing
  const clientRes = await pool.query(`SELECT "id", "trainerId" FROM "Client" WHERE "userId" = $1 LIMIT 1`, [session.user.id])
  const client = clientRes.rows[0] as { id: string; trainerId: string } | undefined

  if (!client) {
    return <NoLongerSubscribedCard />
  }

  const brandingRaw = await getCoachBranding(client.trainerId)
  const branding = { brandName: brandingRaw.effective.brandName, logoUrl: brandingRaw.effective.logoUrl, primaryColor: brandingRaw.effective.primaryColor, coachId: client.trainerId }

  return (
    <BrandingProvider branding={branding}>
      <div className="min-h-dvh bg-background">
        <AppSidebar
          name={session.user.name ?? "Client"}
          role={session.user.role}
          items={CLIENT_NAV_ITEMS}
          homeHref="/client/home"
        />
        <main id="main-content" tabIndex={-1} className="md:ms-[264px] outline-none">
          <div>{children}</div>
        </main>
      </div>
    </BrandingProvider>
  )
}
