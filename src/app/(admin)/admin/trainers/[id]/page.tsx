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
import { adminSuspendCoachAction, adminActivateCoachAction } from "@/server/actions/admin"
import { AdminCoachSubscriptionForm } from "@/components/features/admin/admin-coach-subscription-form"
import { AdminBrandingForm } from "@/components/features/admin/admin-branding-form"

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
  const coach = await getAdminCoachDetails(id)
  if (!coach) notFound()

  const { subscription, payments } = await getCoachSubscriptionWithPayments(id)
  const branding = await getCoachBranding(id)

  const { t, locale } = await getI18n()
  const isSuspended = coach.accountStatus === "SUSPENDED"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{coach.fullName}</h1>
          <p className="text-muted-foreground">{coach.username ?? coach.phone}</p>
        </div>
      <div className="flex gap-2">
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

      <AdminCoachSubscriptionForm coachId={coach.id} subscription={subscription as never} payments={payments as never} />

      <AdminBrandingForm coachId={coach.id} initial={branding as never} />
    </div>
  )
}
