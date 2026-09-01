"use client"

import Link from "next/link"
import { UserPlus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"

export function DashboardEmpty() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-dashed bg-card p-8 sm:p-12 text-center shadow-soft">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.04] via-energy-500/[0.02] to-transparent" aria-hidden="true" />
      <div className="absolute -right-12 -top-12 size-32 rounded-full bg-gradient-to-br from-brand-500/10 to-energy-500/5 blur-2xl" aria-hidden="true" />
      <div className="relative flex flex-col items-center gap-5">
        <div className="relative flex size-20 items-center justify-center rounded-[20px] bg-gradient-to-br from-brand-500 via-brand-600 to-energy-500 text-white shadow-glow ring-1 ring-white/20">
          <UserPlus className="size-9" aria-hidden="true" />
          <span className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-white text-sm font-extrabold text-brand-600 shadow-soft ring-2 ring-brand-500/10 dark:bg-card dark:text-brand-500">
            +
          </span>
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-balance text-xl font-extrabold tracking-tight">
            {t.dashboard.emptyTitle}
          </h2>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {t.dashboard.emptyDescription}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {isAr ? "ابدأ النهاردة — أول بطل هيغيّر يومك 🔥" : "Start today — first athlete will change your day 🔥"}
          </p>
        </div>
        <Button asChild size="lg" className="mt-1 rounded-xl bg-gradient-to-r from-brand-600 to-energy-500 shadow-soft hover:brightness-110 gap-2">
          <Link href="/onboarding">
            <UserPlus className="size-5" aria-hidden="true" />
            {t.dashboard.inviteClient}
          </Link>
        </Button>
      </div>
    </div>
  )
}

export function DashboardQuickActions() {
  const { t } = useI18n()

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Button asChild className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 shadow-soft hover:brightness-110 gap-2">
        <Link href="/onboarding">
          <UserPlus className="size-4" aria-hidden="true" />
          {t.dashboard.inviteClient}
        </Link>
      </Button>
      <Button asChild variant="outline" className="rounded-xl bg-card shadow-soft gap-2">
        <Link href="/clients">
          <Users className="size-4" aria-hidden="true" />
          {t.dashboard.viewClients}
        </Link>
      </Button>
    </div>
  )
}
