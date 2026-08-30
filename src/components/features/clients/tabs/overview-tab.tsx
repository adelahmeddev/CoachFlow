import Link from "next/link"
import { CalendarPlus, ClipboardList, Dumbbell, KeyRound, Utensils, Wallet, MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ClientProfile } from "@/server/services/client-profile.service"
import type { BadgeVariant } from "@/lib/constants"
import {
  getClientStatusBadgeVariant,
  getPlanStatusBadgeVariant,
  getSubscriptionStatusBadgeVariant,
} from "@/lib/constants"
import {
  getClientStatusLabel,
  getGoalLabel,
  getPlanStatusLabel,
  getSplitTypeLabel,
  getSubscriptionStatusLabel,
  formatPlanSize,
} from "@/lib/i18n/labels"
import { getI18n } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n/config"
import { calcAge } from "@/lib/format"
import { formatDate } from "@/lib/i18n/format"
import { cn } from "@/lib/utils"
import { ResetPasswordDialog } from "@/components/features/clients/reset-password-dialog"
import { EditClientInfoDialog } from "@/components/features/clients/edit-client-info-dialog"
import { PainFlagsForm } from "@/components/features/body-composition/pain-flags-form"

type I18n = Awaited<ReturnType<typeof getI18n>>
type T = I18n["t"]

interface OverviewTabProps {
  clientId: string
  profile: ClientProfile
}

export async function OverviewTab({ clientId, profile }: OverviewTabProps) {
  const { t, locale } = await getI18n()

  return (
    <div className="space-y-6">
      <QuickActions clientId={clientId} clientName={profile.client.fullName ?? ""} t={t} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ClientInfoCard clientId={clientId} profile={profile} t={t} locale={locale} />
        <InBodyCard clientId={clientId} profile={profile} t={t} locale={locale} />
        <PainFlagsForm
          clientId={clientId}
          initial={{
            neckPain: (profile.client as unknown as { neckPain?: boolean }).neckPain ?? false,
            shoulderPain: (profile.client as unknown as { shoulderPain?: boolean }).shoulderPain ?? false,
            backPain: (profile.client as unknown as { backPain?: boolean }).backPain ?? false,
            kneePain: (profile.client as unknown as { kneePain?: boolean }).kneePain ?? false,
          }}
        />
        <SubscriptionCard profile={profile} t={t} locale={locale} />
        <NutritionCard profile={profile} t={t} locale={locale} />
        <TrainingSplitCard profile={profile} t={t} locale={locale} />
      </div>
    </div>
  )
}

function QuickActions({ clientId, clientName, t }: { clientId: string; clientName: string; t: T }) {
  const inBodyLabel = t.profile.overview.addInBody ?? t.bodyComposition.addInBody
  const actions = [
    { label: inBodyLabel, href: `/clients/${clientId}?tab=body-composition`, icon: ClipboardList },
    { label: t.nav.messages, href: `/messages/${clientId}`, icon: MessageCircle },
    { label: t.profile.overview.actionManageNutrition, href: `/clients/${clientId}?tab=nutrition`, icon: Utensils },
    { label: t.profile.overview.actionManageTrainingSplit, href: `/clients/${clientId}?tab=training-split`, icon: Dumbbell },
    { label: t.profile.overview.actionViewProgress, href: `/clients/${clientId}?tab=progress`, icon: CalendarPlus },
    { label: t.profile.overview.actionManageSubscription, href: `/clients/${clientId}?tab=subscription`, icon: Wallet },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      {actions.map((action) => (
        <Button key={action.href} asChild variant="outline" className="h-auto flex-col gap-2 py-3 text-xs">
          <Link href={action.href}>
            <action.icon className="size-4" />
            {action.label}
          </Link>
        </Button>
      ))}
      <ResetPasswordDialog
        clientId={clientId}
        clientName={clientName}
        trigger={
          <Button variant="outline" className="h-auto flex-col gap-2 py-3 text-xs">
            <KeyRound className="size-4" />
            {t.clients.resetPassword}
          </Button>
        }
      />
    </div>
  )
}

function ClientInfoCard({ clientId, profile, t, locale }: { clientId: string; profile: ClientProfile; t: T; locale: Locale }) {
  const { client } = profile
  const age = calcAge(client.birthDate)
  const birthDateStr = client.birthDate ? new Date(client.birthDate).toISOString().split("T")[0] : ""

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{t.profile.overview.clientInfoTitle}</CardTitle>
          <CardDescription>{t.profile.overview.clientInfoSubtitle}</CardDescription>
        </div>
        <EditClientInfoDialog
          clientId={clientId}
          initial={{
            fullName: client.fullName ?? "",
            phone: client.phone ?? "",
            birthDate: birthDateStr,
            goal: client.goal ?? "",
            status: client.status,
          }}
        />
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <InfoItem label={t.profile.overview.fullName} value={client.fullName ?? t.profile.overview.invitedClient} />
          <InfoItem label={t.profile.overview.phone} value={client.phone ?? "—"} />
          <InfoItem label={t.profile.overview.birthDate} value={client.birthDate ? formatDate(client.birthDate, locale) : "—"} />
          <InfoItem label={t.profile.overview.age} value={age !== null ? `${age} ${t.profile.overview.years}` : "—"} />
          <InfoItem label={t.profile.overview.goal} value={getGoalLabel(client.goal, locale) ?? "—"} />
          <InfoItem label={t.profile.overview.status} value={getClientStatusLabel(client.status, locale)} badgeVariant={getClientStatusBadgeVariant(client.status)} />
          <InfoItem label={t.profile.overview.basicInfoCompletedLabel} value={client.basicInfoCompletedAt ? formatDate(client.basicInfoCompletedAt, locale) : t.profile.overview.no} />
          <InfoItem label={t.profile.overview.inviteCreated} value={formatDate(client.createdAt, locale)} />
          <InfoItem label={t.profile.overview.inviteExpires} value={client.inviteExpiresAt ? formatDate(client.inviteExpiresAt, locale) : "—"} />
        </dl>
      </CardContent>
    </Card>
  )
}

function InBodyCard({ clientId, profile, t, locale }: { clientId: string; profile: ClientProfile; t: T; locale: Locale }) {
  const inBody = (profile as unknown as { latestBodyComposition?: unknown }).latestBodyComposition
  const bc = inBody as null | {
    date: Date | string
    weightKg: number | null
    muscleMassKg: number | null
    bodyFatKg: number | null
    bodyWaterPct: number | null
    fatControlKg: number | null
    bmrKcal: number | null
    fitnessScore: number | null
    waistHipRatio: number | null
    visceralFatLevel: number | null
    notes: string | null
  }

  const inBodyLabel = t.profile.overview.addInBody ?? t.bodyComposition.addInBody

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Latest InBody</CardTitle>
          <CardDescription>InBody — آخر تحليل</CardDescription>
        </div>
        {bc ? <Badge variant="secondary">InBody</Badge> : null}
      </CardHeader>
      {bc ? (
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <InfoItem label="التاريخ | Date" value={formatDate(bc.date as Date, locale)} />
            <InfoItem label="الوزن (كجم) | WEIGHT (KG)" value={bc.weightKg != null ? `${bc.weightKg} kg` : "—"} />
            <InfoItem label="الكتلة العضلية (كجم) | MUSCLE MASS (KG)" value={bc.muscleMassKg != null ? `${bc.muscleMassKg} kg` : "—"} />
            <InfoItem label="دهون الجسم (كجم) | BODY FAT (KG)" value={bc.bodyFatKg != null ? `${bc.bodyFatKg} kg` : "—"} />
            <InfoItem label="نسبة المياه بالجسم % | BODY WATER %" value={bc.bodyWaterPct != null ? `${bc.bodyWaterPct} %` : "—"} />
            <InfoItem label="التحكم في الدهون (كجم) | FAT CONTROL (KG)" value={bc.fatControlKg != null ? `${bc.fatControlKg} kg` : "—"} />
            <InfoItem label="معدل الأيض الأساسي | BMR" value={bc.bmrKcal != null ? `${Math.round(bc.bmrKcal)} kcal` : "—"} />
            <InfoItem label="مؤشر اللياقة | FITNESS SCORE" value={bc.fitnessScore != null ? String(bc.fitnessScore) : "—"} />
            <InfoItem label="نسبة الخصر للأرداف | WAIST-HIP RATIO" value={bc.waistHipRatio != null ? String(bc.waistHipRatio) : "—"} />
            <InfoItem label="مستوى الدهون الحشوية | VISCERAL FAT LEVEL" value={bc.visceralFatLevel != null ? String(bc.visceralFatLevel) : "—"} />
            {bc.notes ? <InfoItem label={t.profile.overview.trainerNotesLabel} value={truncate(bc.notes, 80)} span /> : null}
          </dl>
        </CardContent>
      ) : (
        <EmptyState text={(t.profile.overview as unknown as Record<string, string>).noBodyCompositionYet ?? "No data yet"} actionLabel={inBodyLabel} actionHref={`/clients/${clientId}?tab=body-composition`} />
      )}
    </Card>
  )
}

function SubscriptionCard({ profile, t, locale }: { profile: ClientProfile; t: T; locale: Locale }) {
  const subscription = profile.latestSubscription

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.profile.overview.subscriptionCardTitle}</CardTitle>
        <CardDescription>{t.profile.overview.subscriptionCardSubtitle}</CardDescription>
      </CardHeader>
      {subscription ? (
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <InfoItem label={t.profile.overview.plan} value={subscription.planName} />
            <InfoItem
              label={t.subscription.planType}
              value={formatPlanSize(subscription, locale)}
            />
            <InfoItem label={t.profile.overview.status} value={getSubscriptionStatusLabel(subscription.status, locale)} badgeVariant={getSubscriptionStatusBadgeVariant(subscription.status)} />
            <InfoItem label={t.subscription.startDate} value={formatDate(subscription.startDate, locale)} />
            <InfoItem label={t.subscription.endDate} value={formatDate(subscription.endDate, locale)} />
            {subscription.planType === "SESSIONS" ? (
              <>
                <InfoItem label={t.subscription.sessions} value={subscription.sessionsCount !== null && subscription.sessionsCount !== undefined ? `${subscription.sessionsCount}` : "—"} />
                <InfoItem label={t.subscription.remainingSessions} value={subscription.remainingSessions !== null && subscription.remainingSessions !== undefined ? `${subscription.remainingSessions}` : "—"} />
              </>
            ) : (
              <InfoItem label={t.subscription.durationDays} value={subscription.durationDays !== null && subscription.durationDays !== undefined ? `${subscription.durationDays}` : "—"} />
            )}
          </dl>
        </CardContent>
      ) : (
        <EmptyState text={t.profile.overview.noSubscriptionYet} />
      )}
    </Card>
  )
}

function NutritionCard({ t }: { profile: ClientProfile; t: T; locale: Locale }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{t.profile.overview.nutritionCardTitle}</CardTitle>
          <CardDescription>{t.profile.overview.nutritionCardSubtitle}</CardDescription>
        </div>
      </CardHeader>
      <EmptyState text={t.profile.overview.noNutritionYet} />
    </Card>
  )
}

function TrainingSplitCard({ profile, t, locale }: { profile: ClientProfile; t: T; locale: Locale }) {
  const split = profile.latestTrainingSplit

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{t.profile.overview.splitCardTitle}</CardTitle>
          <CardDescription>{t.profile.overview.splitCardSubtitle}</CardDescription>
        </div>
        {split ? <Badge variant={getPlanStatusBadgeVariant(split.status)}>{getPlanStatusLabel(split.status, locale)}</Badge> : null}
      </CardHeader>
      {split ? (
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <InfoItem label={t.profile.overview.splitType} value={getSplitTypeLabel(split.splitType, locale)} />
            <InfoItem label={t.profile.overview.daysPerWeek} value={`${split.daysPerWeek} ${t.profile.overview.days}`} />
          </dl>
        </CardContent>
      ) : (
        <EmptyState text={t.profile.overview.noSplitYet} />
      )}
    </Card>
  )
}

function EmptyState({ text, actionLabel, actionHref }: { text: string; actionLabel?: string; actionHref?: string }) {
  return (
    <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {actionLabel && actionHref ? (
        <Button asChild variant="outline" size="sm">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </CardContent>
  )
}

function InfoItem({
  label,
  value,
  badgeVariant,
  span,
}: {
  label: string
  value: string
  badgeVariant?: BadgeVariant
  span?: boolean
}) {
  return (
    <div className={cn("flex flex-col gap-1", span && "sm:col-span-2")}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>
        {badgeVariant ? <Badge variant={badgeVariant}>{value}</Badge> : <span className="text-sm font-medium">{value}</span>}
      </dd>
    </div>
  )
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}
