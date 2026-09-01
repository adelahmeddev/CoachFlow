import Link from "next/link"
import { UserPlus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getI18n } from "@/lib/i18n"

export async function ClientsEmptyState({
  variant,
}: {
  variant: "no-clients" | "no-results"
}) {
  const { t } = await getI18n()

  if (variant === "no-results") {
    return (
      <div className="relative overflow-hidden rounded-[20px] border border-dashed bg-card p-10 text-center shadow-soft">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.03] to-transparent" aria-hidden="true" />
        <div className="relative flex flex-col items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Users className="size-8" />
          </span>
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight">
              {t.clients.emptyTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t.clients.emptyDescription}
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/clients">{t.clients.clearFilters}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-dashed bg-card p-10 sm:p-12 text-center shadow-soft">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.05] via-energy-500/[0.02] to-transparent" aria-hidden="true" />
      <div className="absolute -right-12 -top-12 size-32 rounded-full bg-gradient-to-br from-brand-500/10 to-energy-500/5 blur-2xl" aria-hidden="true" />
      <div className="relative flex flex-col items-center gap-5">
        <span className="flex size-20 items-center justify-center rounded-[20px] bg-gradient-to-br from-brand-500 to-energy-500 text-white shadow-glow ring-1 ring-white/20">
          <UserPlus className="size-9" />
        </span>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl font-extrabold tracking-tight">
            {t.clients.noClientsTitle}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t.clients.noClientsDescription}
          </p>
          <p className="text-xs text-muted-foreground/70">ابدأ بدعوة أول بطل — هتشوف الفرق 🔥</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 gap-2">
            <Link href="/onboarding">
              <UserPlus className="size-4" />
              {t.clients.inviteClient}
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl bg-card">
            <Link href="/clients">
              <Users className="size-4" />
              {t.dashboard.viewClients}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
