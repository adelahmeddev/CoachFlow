import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getCurrentSession } from "@/server/auth"
import { listNotifications } from "@/server/services/notification.service"
import { NotificationList } from "@/components/features/notifications/notification-list"
import { getI18n } from "@/lib/i18n"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.notifications.title }
}

export default async function NotificationsPage() {
  const { t } = await getI18n()
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "COACH") {
    redirect("/login")
  }

  // Degraded fallback — a transient DB timeout must never throw the coach into
  // the route error boundary (whose only exit is /dashboard). Same pattern as
  // the dashboard page: render the shell with an empty feed instead of crashing.
  let initial: Awaited<ReturnType<typeof listNotifications>>["notifications"] = []
  let initialCursor: string | null = null
  try {
    const page = await listNotifications(session.user.id, { limit: 20 })
    initial = page.notifications
    initialCursor = page.nextCursor
  } catch (err) {
    console.error("[notifications] failed to load", err)
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.notifications.title}</h1>
        <p className="text-sm text-muted-foreground">{t.notifications.subtitle}</p>
      </div>
      <NotificationList initial={initial} initialCursor={initialCursor} />
    </div>
  )
}
