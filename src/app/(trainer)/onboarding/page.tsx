import Link from "next/link"
import { getCurrentSession } from "@/server/auth"
import { getTrainerInvites } from "@/server/services/invite.service"
import { JoinLinkCard } from "@/components/features/onboarding/join-link-card"
import { InviteList } from "@/components/features/onboarding/invite-list"
import { getI18n } from "@/lib/i18n"
import type { Metadata } from "next"
import { pool } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, ArrowRight, ArrowLeft } from "lucide-react"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return {
    title: t.onboarding.title,
    description: t.onboarding.description,
  }
}

export default async function OnboardingPage() {
  const { t, locale } = await getI18n()
  const isAr = locale === "ar"
  const Arrow = isAr ? ArrowLeft : ArrowRight
  const session = await getCurrentSession()
  // Handle missing/stale trainerProfileId (e.g., after DB reset with old JWT)
  let trainerProfileId = session?.user.trainerProfileId
  if (session?.user.role === "COACH" && !trainerProfileId && session.user.id) {
    const byUserRes = await pool.query(`SELECT "id" FROM "TrainerProfile" WHERE "userId" = $1 LIMIT 1`, [session.user.id])
    const byUser = byUserRes.rows[0] as { id: string } | undefined
    trainerProfileId = byUser?.id
  }
  const invites = trainerProfileId ? await getTrainerInvites(trainerProfileId) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.onboarding.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.onboarding.description}
          </p>
        </div>
        <Button asChild className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 shadow-soft">
          <Link href="/clients?new=true">
            <UserPlus className="size-4 me-2" />
            {isAr ? "إضافة متدرب يدوياً" : "Add Client Manually"}
          </Link>
        </Button>
      </div>

      {/* Direct Add Client Banner */}
      <Card className="overflow-hidden border-brand-500/30 bg-gradient-to-br from-brand-500/[0.08] via-card to-card shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-energy-500 text-white shadow-soft">
                <UserPlus className="size-5" />
              </span>
              <div>
                <CardTitle className="text-lg">
                  {isAr ? "طريقة جديدة: إضافة متدرب يدوياً فوراً" : "New Method: Add Client Directly"}
                </CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  {isAr 
                    ? "سجّل بيانات المتدرب الأساسية وقياساته وتاريخه الطبي، وولّد كلمة مرور فورية وأرسلها له عبر واتساب." 
                    : "Register client details, body measurements, medical history, auto-generate credentials and send via WhatsApp."}
                </CardDescription>
              </div>
            </div>
            <Button asChild className="shrink-0 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 shadow-soft">
              <Link href="/clients?new=true">
                {isAr ? "ابدأ التسجيل المباشر" : "Start Direct Registration"}
                <Arrow className="size-4 ms-2" />
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <JoinLinkCard />
      <InviteList invites={invites} />
    </div>
  )
}
