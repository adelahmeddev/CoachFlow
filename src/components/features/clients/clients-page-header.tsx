import Link from "next/link"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getI18n } from "@/lib/i18n"

export async function ClientsPageHeader() {
  const { t } = await getI18n()
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-[26px]">
          {t.clients.title}
        </h1>
        <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{t.clients.subtitle}</p>
      </div>
      <Button asChild className="w-full shadow-soft sm:w-auto">
        <Link href="/onboarding">
          <UserPlus className="size-4" aria-hidden="true" />
          {t.clients.inviteClient}
        </Link>
      </Button>
    </div>
  )
}
