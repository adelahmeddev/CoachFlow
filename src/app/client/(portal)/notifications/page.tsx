import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getCurrentSession } from "@/server/auth"
import { listNotifications } from "@/server/services/notification.service"
import { NotificationList } from "@/components/features/notifications/notification-list"
import { getI18n } from "@/lib/i18n"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.notifications.title }
}

export default async function ClientNotificationsPage() {
  const { t } = await getI18n()
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "CLIENT") {
    redirect("/client/login")
  }

  const page = await listNotifications(session.user.id, { limit: 20 })

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.notifications.title}</h1>
        <p className="text-sm text-muted-foreground">{t.notifications.subtitle}</p>
      </div>
      <NotificationList initial={page.notifications} initialCursor={page.nextCursor} />
    </div>
  )
}
