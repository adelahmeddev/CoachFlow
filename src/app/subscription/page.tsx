import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getCoachSubscriptionWithPayments, getDaysRemaining, getRemainingLabel } from "@/server/services/coach-subscription.service"
import { getCoachBranding, DEFAULT_BRANDING } from "@/server/services/branding.service"
import { BrandingProvider } from "@/components/branding/branding-provider"
import { CoachSubscriptionStatus } from "@/lib/db/enums"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { COACH_SUBSCRIPTION_STATUS_BADGE_VARIANTS } from "@/lib/constants"
import { formatDate } from "@/lib/i18n/format"

export const metadata = { title: "Subscription" }

export default async function SubscriptionPage() {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "COACH" || !session.user.trainerProfileId) {
    redirect("/login")
  }

  const { subscription: sub, payments } = await getCoachSubscriptionWithPayments(session.user.trainerProfileId)
  const brandingRaw = await getCoachBranding(session.user.trainerProfileId)
  const branding = { brandName: brandingRaw.effective.brandName, logoUrl: brandingRaw.effective.logoUrl, primaryColor: brandingRaw.effective.primaryColor, coachId: session.user.trainerProfileId }

  return (
    <BrandingProvider branding={branding}>
      <div className="mx-auto max-w-3xl space-y-6 py-8 px-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your Subscription</h1>
        <p className="text-muted-foreground">View your current subscription — managed by admin after you pay outside the platform.</p>
      </div>

      {sub ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {sub.status === "ACTIVE" ? "🟢 Active" : sub.status === "EXPIRED" ? "🔴 Expired" : "⛔ Suspended"}
              <Badge variant={COACH_SUBSCRIPTION_STATUS_BADGE_VARIANTS[sub.status as CoachSubscriptionStatus] ?? "outline"}>{sub.status}</Badge>
            </CardTitle>
            <CardDescription>
              Expires: {formatDate(sub.endDate as string, "en")} · {getRemainingLabel(sub.endDate, sub.status)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Start Date: {formatDate(sub.startDate as string, "en")}</div>
            <div>End Date: {formatDate(sub.endDate as string, "en")}</div>
            <div>Days Remaining: {getDaysRemaining(sub.endDate) ?? "—"}</div>
            <div>Amount Paid: {String(sub.amountPaid)} EGP</div>
            <div>Payment Date: {formatDate(sub.paymentDate as string, "en")}</div>
            {sub.notes && <div className="text-muted-foreground">Notes: {sub.notes as string}</div>}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">No subscription yet. Please contact admin — your subscription will be created after you pay outside Coach Flow.</CardContent>
        </Card>
      )}

      {payments.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle><CardDescription>Manual records — admin enters after receiving money outside the platform</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {payments.map((p: Record<string, unknown>) => (
              <div key={p.id as string} className="flex justify-between text-sm border-b py-2 last:border-0">
                <div>
                  <div className="font-medium">{formatDate(p.paymentDate as string, "en")} · {String(p.amount)} EGP</div>
                  {p.notes ? <div className="text-xs text-muted-foreground">{p.notes as string}</div> : null}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(p.createdAt as string, "en")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <a href="/dashboard" className="text-sm text-muted-foreground underline">Back to dashboard</a>
        <span className="text-muted-foreground">·</span>
        <a href="/settings" className="text-sm text-muted-foreground underline">Settings</a>
      </div>
      </div>
    </BrandingProvider>
  )
}
