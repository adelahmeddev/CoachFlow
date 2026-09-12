import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { pool } from "@/lib/db"
import { AppTopNav } from "@/components/layout/app-top-nav"
import { NoLongerSubscribedCard } from "@/components/features/client/no-longer-subscribed"
import { getCoachBranding, toBranding } from "@/server/services/branding.service"
import { BrandingProvider } from "@/components/branding/branding-provider"
import { CoachSocialFooter } from "@/components/branding/coach-social-footer"

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
  const branding = toBranding(brandingRaw, client.trainerId)

  return (
    <BrandingProvider branding={branding}>
      <div className="min-h-dvh bg-background">
        <AppTopNav
          name={session.user.name ?? "Client"}
          role={session.user.role}
          homeHref="/client/home"
        />
        <main id="main-content" tabIndex={-1} className="outline-none">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8 pb-28">{children}</div>
        </main>
        <CoachSocialFooter className="px-4 pb-10" />
      </div>
    </BrandingProvider>
  )
}
