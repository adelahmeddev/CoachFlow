import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { prisma } from "@/lib/prisma"

import { NoLongerSubscribedCard } from "@/components/features/client/no-longer-subscribed"

export default async function ClientSessionLayout({
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

  if (!user) {
    return <NoLongerSubscribedCard />
  }

  if (user.mustChangePassword) {
    redirect("/client/change-password")
  }

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!client) {
    return <NoLongerSubscribedCard />
  }

  return (
    <div className="min-h-dvh bg-background">
      <main id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
    </div>
  )
}
