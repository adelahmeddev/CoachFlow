import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { prisma } from "@/lib/prisma"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { CLIENT_NAV_ITEMS } from "@/components/layout/nav-items"
import { NoLongerSubscribedCard } from "@/components/features/client/no-longer-subscribed"

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== "CLIENT") {
    redirect("/client/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mustChangePassword: true },
  })

  // Account deleted by trainer (hard delete) -> user row no longer exists
  // Show friendly "No longer subscribed" instead of generic 404/redirect loop
  if (!user) {
    return <NoLongerSubscribedCard />
  }

  if (user.mustChangePassword) {
    redirect("/client/change-password")
  }

  // Client record deleted by trainer (soft keep-user case) -> user exists but client link missing
  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!client) {
    return <NoLongerSubscribedCard />
  }

  return (
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
  )
}
