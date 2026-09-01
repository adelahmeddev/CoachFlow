import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { pool } from "@/lib/db"

import { NoLongerSubscribedCard } from "@/components/features/client/no-longer-subscribed"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientSessionLayout({
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

  if (!user) {
    return <NoLongerSubscribedCard />
  }

  if (user.mustChangePassword) {
    redirect("/client/change-password")
  }

  const clientRes = await pool.query(`SELECT "id" FROM "Client" WHERE "userId" = $1 LIMIT 1`, [session.user.id])
  const client = clientRes.rows[0] as { id: string } | undefined

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
