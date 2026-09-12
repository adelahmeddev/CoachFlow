import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getI18n } from "@/lib/i18n"
import { pool } from "@/lib/db"
import { getCurrentSession } from "@/server/auth"

import { ProfileForm } from "@/components/features/settings/profile-form"
import { BrandingSection } from "@/components/features/settings/branding-section"
import { CoachPhotoSection } from "@/components/features/settings/coach-photo-section"
import { SecurityForm } from "@/components/features/settings/security-form"
import { PreferencesForm } from "@/components/features/settings/preferences-form"
import { DataTab } from "@/components/features/settings/data-tab"
import type { TrainerProfile } from "@/lib/db/types"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return {
    title: t.settings.title,
    description: t.settings.subtitle,
  }
}

export default async function SettingsPage() {
  const { t, locale } = await getI18n()

  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "COACH") {
    redirect("/login")
  }
  if (!session.user.trainerProfileId) {
    redirect("/onboarding")
  }

  const profileRes = await pool.query<TrainerProfile>(`SELECT * FROM "TrainerProfile" WHERE "id" = $1 LIMIT 1`, [session.user.trainerProfileId])
  const profileRow = profileRes.rows[0] as TrainerProfile | undefined
  if (!profileRow) {
    redirect("/onboarding")
  }
  const countRes = await pool.query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM "Client" WHERE "trainerId" = $1`, [profileRow.id])
  const profile = {
    ...profileRow,
    _count: { clients: (countRes.rows[0] as { count: number }).count },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.settings.title}
        </h1>
        <p className="text-sm text-muted-foreground">{t.settings.subtitle}</p>
      </div>

      {/* Profile Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">{t.settings.profile.title}</h2>
        <ProfileForm fullName={profile.fullName} phone={profile.phone} />
      </section>

      {/* Branding Section — coach self-service logo + identity.
          Reads the same live BrandingProvider as the topnav/sidebar, so a
          save updates the whole platform instantly. */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">{t.settings.branding.title}</h2>
        <p className="text-sm text-muted-foreground">{t.settings.branding.subtitle}</p>
        <BrandingSection />
      </section>

      {/* Coach photo — personal avatar, independent from the brand logo. */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">{t.settings.branding.photoTitle}</h2>
        <p className="text-sm text-muted-foreground">{t.settings.branding.photoHint}</p>
        <CoachPhotoSection />
      </section>

      {/* Security Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">{t.settings.tabs.security}</h2>
          <SecurityForm />
        </section>
        {/* Preferences Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">{t.settings.tabs.preferences}</h2>
          <PreferencesForm
            defaults={{
              language: locale,
              units: profile.units,
              weekStartDay: profile.weekStartDay,
              timezone: profile.timezone,
            }}
          />
        </section>
        {/* Data Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">{t.settings.tabs.data}</h2>
          <DataTab clientCount={profile._count.clients} />
        </section>
    </div>
  )
}
