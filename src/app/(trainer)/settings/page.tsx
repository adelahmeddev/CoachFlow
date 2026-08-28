import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getI18n } from "@/lib/i18n"
import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/server/auth"
import { SettingsTabs } from "@/components/features/settings/settings-tabs"
import { ProfileForm } from "@/components/features/settings/profile-form"
import { SecurityForm } from "@/components/features/settings/security-form"
import { PreferencesForm } from "@/components/features/settings/preferences-form"
import { NotificationsForm } from "@/components/features/settings/notifications-form"
import { BusinessForm } from "@/components/features/settings/business-form"
import { DataTab } from "@/components/features/settings/data-tab"

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
  if (
    !session?.user ||
    session.user.role !== "TRAINER" ||
    !session.user.trainerProfileId
  ) {
    redirect("/login")
  }

  const profile = await prisma.trainerProfile.findUnique({
    where: { id: session.user.trainerProfileId },
    include: { _count: { select: { clients: true } } },
  })
  if (!profile) {
    redirect("/onboarding")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.settings.title}
        </h1>
        <p className="text-sm text-muted-foreground">{t.settings.subtitle}</p>
      </div>

      <SettingsTabs
        items={[
          {
            value: "profile",
            label: t.settings.tabs.profile,
            content: <ProfileForm fullName={profile.fullName} phone={profile.phone} />,
          },
          {
            value: "security",
            label: t.settings.tabs.security,
            content: <SecurityForm />,
          },
          {
            value: "preferences",
            label: t.settings.tabs.preferences,
            content: (
              <PreferencesForm
                defaults={{
                  language: locale,
                  units: profile.units,
                  weekStartDay: profile.weekStartDay,
                  timezone: profile.timezone,
                }}
              />
            ),
          },
          {
            value: "notifications",
            label: t.settings.tabs.notifications,
            content: (
              <NotificationsForm
                defaults={{
                  notifyReassessment: profile.notifyReassessment,
                  notifyInactivity: profile.notifyInactivity,
                  notifySubscription: profile.notifySubscription,
                  weeklySummary: profile.weeklySummary,
                }}
              />
            ),
          },
          {
            value: "business",
            label: t.settings.tabs.business,
            content: (
              <BusinessForm businessName={profile.businessName ?? ""} />
            ),
          },
          {
            value: "data",
            label: t.settings.tabs.data,
            content: <DataTab clientCount={profile._count.clients} />,
          },
        ]}
      />
    </div>
  )
}
