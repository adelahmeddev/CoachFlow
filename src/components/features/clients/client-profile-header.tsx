import Link from "next/link"
import { ArrowLeft, MessageCircle, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DeleteClientButton } from "@/components/features/clients/delete-client-button"
import { CopyPortalLinkButton } from "@/components/features/clients/copy-portal-link-button"
import type { ClientProfile } from "@/server/services/client-profile.service"
import {
  getClientStatusBadgeVariant,
  getClientStatusLabel,
  getGoalBadgeVariant,
  getGoalLabel,
} from "@/lib/constants"
import { calcAge } from "@/lib/format"
import { getI18n } from "@/lib/i18n"
import { getAppUrl } from "@/lib/app-url"

interface ClientProfileHeaderProps {
  profile: ClientProfile
}

export async function ClientProfileHeader({ profile }: ClientProfileHeaderProps) {
  const { t, locale } = await getI18n()
  const isAr = locale === "ar"
  const { client } = profile
  const name = client.fullName ?? t.profile.overview.invitedClient
  const age = calcAge(client.birthDate)
  const phone = client.phone
  const normalizedPhone = phone ? normalizePhone(phone) : null
  const portalUrl = `${getAppUrl()}/client/home`
  const whatsappUrl = normalizedPhone ? buildWhatsAppUrl(normalizedPhone, name, portalUrl, locale) : null
  const whatsappLabel = isAr ? "واتساب للبطل" : "WhatsApp"
  // mock streak & goal progress
  const mockStreak = (() => {
    let h = 0
    for (let i = 0; i < client.id.length; i++) h = (h * 33 + client.id.charCodeAt(i)) >>> 0
    const r = h % 10
    if (r < 5) return 0
    if (r < 8) return (h % 6) + 2
    return (h % 12) + 6
  })()
  const hasActivePlan = !!profile.latestTrainingSplit || !!profile.latestSubscription

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2 ps-0 text-muted-foreground hover:text-foreground">
          <Link href="/clients">
            <ArrowLeft className="size-4 rtl:-scale-x-100" />
            {t.profile.overview.backToClients}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <CopyPortalLinkButton portalUrl={portalUrl} />
          {whatsappUrl && (
            <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-xl bg-card">
              <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4 text-performance-600" />
                <span className="hidden sm:inline">{whatsappLabel}</span>
              </Link>
            </Button>
          )}
          <DeleteClientButton
            clientId={client.id}
            clientName={name}
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
          />
        </div>
      </div>

      {/* HERO — light, premium, scannable in 2s */}
      <div className="group relative overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/15 to-transparent" aria-hidden="true" />
        <div className="p-4 sm:p-5">
          <div className="flex gap-3 sm:gap-4">
            {/* Avatar — subtle, interactive */}
            <div className="relative shrink-0">
              <div className="flex size-14 sm:size-[56px] items-center justify-center rounded-xl bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/15 text-base font-extrabold dark:bg-brand-500/15 dark:text-brand-300 transition-transform duration-200 group-hover:scale-[1.02]">
                {initials(name)}
              </div>
              {mockStreak > 0 && (
                <span className="absolute -bottom-1.5 -end-1.5 inline-flex items-center gap-1 rounded-full bg-card px-1.5 py-0.5 text-xs font-bold shadow-soft ring-1 ring-border">
                  <span aria-hidden="true" className="text-[10px] leading-none">🔥</span>
                  <span className="tabular-nums text-xs">{mockStreak}</span>
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="truncate text-[17px] sm:text-xl font-bold tracking-tight leading-tight">
                    {name}
                  </h1>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant={getGoalBadgeVariant(client.goal)} className="h-5 px-2 text-[11px] font-medium">
                      {getGoalLabel(client.goal) ?? t.profile.overview.noGoalSet}
                    </Badge>
                    <Badge variant={getClientStatusBadgeVariant(client.status)} className="h-5 px-2 text-[11px]">
                      {getClientStatusLabel(client.status)}
                    </Badge>
                    {hasActivePlan && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:text-brand-300">
                        <span className="size-1.5 rounded-full bg-brand-500" />
                        {isAr ? "نشط" : "Active"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary action — subtle, not huge gradient */}
                <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex rounded-xl gap-1.5 bg-card hover:border-brand-200 hover:text-brand-700 dark:hover:border-brand-900/50 shrink-0">
                  <Link href={`/messages/${client.id}`}>
                    <MessageCircle className="size-3.5" />
                    {isAr ? "رسالة" : "Message"}
                  </Link>
                </Button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                <span dir="ltr" className="tabular-nums font-medium text-foreground/70">
                  {phone ?? (isAr ? "بدون تليفون" : "no phone")}
                </span>
                {age !== null && <span className="tabular-nums">• {age} {isAr ? "سنة" : "y"}</span>}
                {!client.userId && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">{isAr ? "مدعو" : "Invited"}</span>
                )}
                {!client.basicInfoCompletedAt && (
                  <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                    {isAr ? "ناقص بيانات" : "missing info"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4 metrics — light, icons, no heavy color blocks */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                label: isAr ? "البرنامج" : "Program",
                value: profile.latestTrainingSplit ? `${profile.latestTrainingSplit.daysPerWeek} ${isAr ? "أيام" : "days"}` : isAr ? "—" : "—",
                sub: profile.latestTrainingSplit ? (isAr ? "نشط" : "active") : isAr ? "مفيش برنامج" : "no plan",
                icon: "🏋️",
              },
              {
                label: isAr ? "الباقة" : "Package",
                value: profile.latestSubscription ? profile.latestSubscription.planName : isAr ? "—" : "—",
                sub: profile.latestSubscription ? (isAr ? "سارية" : "active") : isAr ? "مفيش باقة" : "no package",
                icon: "📦",
              },
              {
                label: "Streak",
                value: mockStreak ? `${mockStreak} ${isAr ? "يوم" : "d"}` : "—",
                sub: mockStreak >= 7 ? (isAr ? "ممتاز" : "great") : mockStreak ? (isAr ? "مستمر" : "going") : isAr ? "ابدأ" : "start",
                icon: "🔥",
              },
              {
                label: isAr ? "آخر نشاط" : "Last active",
                value: client.basicInfoCompletedAt
                  ? new Date(client.basicInfoCompletedAt).toLocaleDateString(isAr ? "ar-EG" : "en-GB", { day: "2-digit", month: "short" })
                  : isAr ? "—" : "—",
                sub: client.basicInfoCompletedAt ? (isAr ? "تابع تقدمه" : "check progress") : isAr ? "مفيش" : "—",
                icon: "⏱️",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl border bg-muted/30 px-3 py-2.5 text-start transition-colors hover:bg-card hover:shadow-soft hover:border-border"
              >
                <div className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="text-xs leading-none">
                    {m.icon}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{m.label}</span>
                </div>
                <p className="mt-1 truncate text-sm font-semibold leading-none tracking-tight">{m.value}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Mobile primary action */}
          <div className="mt-3 flex sm:hidden">
            <Button asChild size="sm" className="w-full rounded-xl gap-2 bg-foreground text-background hover:bg-foreground/90">
              <Link href={`/messages/${client.id}`}>
                <MessageCircle className="size-4" />
                {isAr ? "ابعت رسالة" : "Message"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ClientProfileHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
    </div>
  )
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (!digits) return ""
  if (digits.startsWith("0")) {
    // Egyptian mobile: 01XXXXXXXXX -> 201XXXXXXXXX
    return "20" + digits.slice(1)
  }
  if (digits.startsWith("20")) return digits
  // fallback: assume already international
  return digits
}

function buildWhatsAppUrl(phone: string, clientName: string, portalUrl: string, locale: string) {
  const arMessage = `أهلاً ${clientName} 👋\nتفضل رابط بوابتك عشان تتابع خطتك التدريبية:\n${portalUrl}`
  const enMessage = `Hey ${clientName} 👋\nHere's your portal link to follow your training plan:\n${portalUrl}`
  const message = locale === "ar" ? arMessage : enMessage
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${phone}?text=${encoded}`
}
