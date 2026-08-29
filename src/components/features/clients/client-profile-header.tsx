import Link from "next/link"
import { ArrowLeft, MessageCircle, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DeleteClientButton } from "@/components/features/clients/delete-client-button"
import type { ClientProfile } from "@/server/services/client-profile.service"
import {
  getClientStatusBadgeVariant,
  getClientStatusLabel,
  getGoalBadgeVariant,
  getGoalLabel,
} from "@/lib/constants"
import { calcAge } from "@/lib/format"
import { getI18n } from "@/lib/i18n"

interface ClientProfileHeaderProps {
  profile: ClientProfile
}

export async function ClientProfileHeader({ profile }: ClientProfileHeaderProps) {
  const { t, locale } = await getI18n()
  const { client } = profile
  const name = client.fullName ?? t.profile.overview.invitedClient
  const age = calcAge(client.birthDate)
  const phone = client.phone
  const normalizedPhone = phone ? normalizePhone(phone) : null
  const whatsappUrl = normalizedPhone ? buildWhatsAppUrl(normalizedPhone, name, locale) : null
  const whatsappLabel = locale === "ar" ? "إرسال تذكير واتساب" : "Send WhatsApp Reminder"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-2 ps-0 text-muted-foreground">
          <Link href="/clients">
            <ArrowLeft className="size-4 rtl:-scale-x-100" />
            {t.profile.overview.backToClients}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {whatsappUrl && (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                {whatsappLabel}
              </Link>
            </Button>
          )}
          <DeleteClientButton
            clientId={client.id}
            clientName={name}
            variant="ghost"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
          />
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/onboarding">
              <UserPlus className="size-4" />
              {t.profile.overview.inviteClient}
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="text-lg">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
              <Badge variant={getGoalBadgeVariant(client.goal)}>{getGoalLabel(client.goal) ?? t.profile.overview.noGoalSet}</Badge>
              <Badge variant={getClientStatusBadgeVariant(client.status)}>{getClientStatusLabel(client.status)}</Badge>
              {client.basicInfoCompletedAt ? <Badge variant="secondary">{t.profile.overview.basicInfoCompleted}</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {client.phone ?? t.profile.overview.noPhone}
              {age !== null ? ` · ${age} ${t.profile.overview.years}` : ""}
              {client.userId ? "" : ` · ${t.profile.overview.invited}`}
            </p>
          </div>
        </div>
        <p className="font-mono text-xs text-muted-foreground">ID: {client.id}</p>
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

function buildWhatsAppUrl(phone: string, clientName: string, locale: string) {
  const arMessage = `أهلاً ${clientName} 👋 متنساش تبدأ تمرينك النهارده 💪🔥 شد حيلك وخلّي التمرين يخلص قبل ما اليوم يخلص!`
  const enMessage = `Hey ${clientName} 👋 Don't forget to start your workout today! 💪🔥 Stay on track and get it done!`
  const message = locale === "ar" ? arMessage : enMessage
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${phone}?text=${encoded}`
}
