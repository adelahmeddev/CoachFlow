import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getAdminCoachDetails } from "@/server/services/admin.service"
import { getCoachSubscriptionWithPayments } from "@/server/services/coach-subscription.service"
import { getCoachBranding } from "@/server/services/branding.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/i18n/format"
import { getI18n } from "@/lib/i18n"
import { logger } from "@/lib/logger"
import { adminSuspendCoachAction, adminActivateCoachAction } from "@/server/actions/admin"
import { AdminCoachSubscriptionForm } from "@/components/features/admin/admin-coach-subscription-form"
import { AdminBrandingForm } from "@/components/features/admin/admin-branding-form"
import { DeleteTrainerButton } from "@/components/features/admin/delete-trainer-button"
import { TrainerSubscriptionWhatsAppActions } from "@/components/features/admin/trainer-subscription-whatsapp-actions"
import { getWhatsAppTemplates } from "@/server/services/system-settings.service"
import { AdminErrorState } from "@/components/features/admin/admin-error-state"

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Coach Details" }
}

async function suspendAction(formData: FormData) {
  "use server"
  const id = formData.get("coachId") as string
  await adminSuspendCoachAction(id)
}

async function activateAction(formData: FormData) {
  "use server"
  const id = formData.get("coachId") as string
  await adminActivateCoachAction(id)
}

export default async function CoachDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    notFound()
  }

  const { id } = await params
  const { t: tEarly } = await getI18n()
  let coach: Awaited<ReturnType<typeof getAdminCoachDetails>>
  try {
    coach = await getAdminCoachDetails(id)
  } catch (err) {
    logger.error("[admin] failed to load coach details", err)
    return (
      <div className="space-y-6">
        <AdminErrorState
          title={tEarly.admin.common.loadErrorTitle}
          description={tEarly.admin.common.loadErrorDescription}
          retryHref={`/admin/trainers/${id}`}
          retryLabel={tEarly.admin.common.retry}
        />
      </div>
    )
  }
  if (!coach) notFound()

  let subscription: Awaited<ReturnType<typeof getCoachSubscriptionWithPayments>>["subscription"]
  let payments: Awaited<ReturnType<typeof getCoachSubscriptionWithPayments>>["payments"]
  let branding: Awaited<ReturnType<typeof getCoachBranding>>
  let whatsAppTemplates: Awaited<ReturnType<typeof getWhatsAppTemplates>>
  try {
    const loaded = await Promise.all([
      getCoachSubscriptionWithPayments(id),
      getCoachBranding(id),
      getWhatsAppTemplates(),
    ])
    subscription = loaded[0].subscription
    payments = loaded[0].payments
    branding = loaded[1]
    whatsAppTemplates = loaded[2]
  } catch (err) {
    logger.error("[admin] failed to load coach related data", err)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{coach.fullName}</h1>
          <p className="text-muted-foreground">{coach.username ?? coach.phone}</p>
        </div>
        <AdminErrorState
          title={tEarly.admin.common.loadErrorTitle}
          description={tEarly.admin.common.loadErrorDescription}
          retryHref={`/admin/trainers/${id}`}
          retryLabel={tEarly.admin.common.retry}
        />
      </div>
    )
  }

  const { locale } = await getI18n()
  const isSuspended = coach.accountStatus === "SUSPENDED"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{coach.fullName}</h1>
          <p className="text-muted-foreground">{coach.username ?? coach.phone}</p>
        </div>
      <div className="flex flex-wrap gap-2">
        {isSuspended ? (
          <form action={activateAction}>
            <input type="hidden" name="coachId" value={coach.id} />
            <Button type="submit">Activate</Button>
          </form>
        ) : (
          <form action={suspendAction}>
            <input type="hidden" name="coachId" value={coach.id} />
            <Button type="submit" variant="destructive">Suspend</Button>
          </form>
        )}
        <DeleteTrainerButton coachId={coach.id} coachName={coach.fullName} />
      </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isSuspended ? "destructive" : "default"}>
              {coach.accountStatus}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{coach.clientsCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(coach.createdAt, locale)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{coach.phone}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{coach.email ?? "Not set"}</p>
          </CardContent>
        </Card>
      </div>

      <TrainerSubscriptionWhatsAppActions
        coachName={coach.fullName}
        phone={coach.phone}
        subscription={
          subscription
            ? {
                status: (subscription as { status: string }).status,
                endDate: (subscription as { endDate: Date | string | null }).endDate,
              }
            : null
        }
        initialTemplates={whatsAppTemplates}
      />

      <AdminCoachSubscriptionForm coachId={coach.id} subscription={subscription as never} payments={payments as never} />

      <AdminBrandingForm coachId={coach.id} initial={branding as never} />
    </div>
  )
}
