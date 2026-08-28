"use client"

import Link from "next/link"
import { UserPlus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"

export function DashboardEmpty() {
  const { t } = useI18n()

  return (
    <Card className="overflow-hidden border-dashed bg-card shadow-soft">
      <CardContent className="flex flex-col items-center gap-5 px-6 py-14 text-center sm:py-16">
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-medium">
          <UserPlus className="size-8" aria-hidden="true" />
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-brand-700 shadow-soft ring-1 ring-brand-500/10 dark:bg-card dark:text-brand-500">
            +
          </span>
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-balance text-lg font-semibold tracking-tight">
            {t.dashboard.emptyTitle}
          </h2>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {t.dashboard.emptyDescription}
          </p>
        </div>
        <Button asChild size="default" className="mt-1 shadow-soft">
          <Link href="/onboarding">
            <UserPlus className="size-4" aria-hidden="true" />
            {t.dashboard.inviteClient}
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground/70">
          {t.dashboard.subtitle ?? ""}
        </p>
      </CardContent>
    </Card>
  )
}

export function DashboardQuickActions() {
  const { t } = useI18n()

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Button asChild className="shadow-soft">
        <Link href="/onboarding">
          <UserPlus className="size-4" aria-hidden="true" />
          {t.dashboard.inviteClient}
        </Link>
      </Button>
      <Button asChild variant="outline" className="bg-card shadow-soft">
        <Link href="/clients">
          <Users className="size-4" aria-hidden="true" />
          {t.dashboard.viewClients}
        </Link>
      </Button>
    </div>
  )
}
