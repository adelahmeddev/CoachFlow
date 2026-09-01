import Link from "next/link"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getI18n } from "@/lib/i18n"

export async function ClientsPageHeader() {
  const { t, locale } = await getI18n()
  const isAr = locale === "ar"
  return (
    <div className="relative overflow-hidden rounded-[20px] border bg-card p-6 shadow-soft">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-energy-500/[0.03] to-transparent" aria-hidden="true" />
      <div className="absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br from-brand-500/15 to-energy-500/10 blur-2xl" aria-hidden="true" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-500/15 dark:bg-brand-500/15 dark:text-brand-300">
            <span className="size-1.5 rounded-full bg-brand-500 animate-pulse" aria-hidden="true" />
            {isAr ? "عيلتك الرياضية" : "Your Fit Family"}
          </div>
          <h1 className="text-balance text-2xl font-extrabold tracking-tight sm:text-[28px] leading-tight">
            {t.clients.title}
            <span className="ms-2 hidden sm:inline text-brand-600/20">•</span>
            <span className="ms-2 text-sm font-medium text-muted-foreground hidden sm:inline">
              {t.clients.subtitle}
            </span>
          </h1>
          <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground sm:hidden">{t.clients.subtitle}</p>
        </div>
        <Button asChild className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 shadow-soft hover:brightness-110 gap-2">
          <Link href="/onboarding">
            <UserPlus className="size-4" aria-hidden="true" />
            {t.clients.inviteClient}
          </Link>
        </Button>
      </div>
    </div>
  )
}
