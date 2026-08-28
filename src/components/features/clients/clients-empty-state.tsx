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
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="size-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              {t.clients.emptyTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t.clients.emptyDescription}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/clients">{t.clients.clearFilters}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500/10 to-brand-600/10 text-brand-600 dark:text-brand-400">
          <UserPlus className="size-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            {t.clients.noClientsTitle}
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t.clients.noClientsDescription}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/onboarding">
              <UserPlus className="size-4" />
              {t.clients.inviteClient}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/clients">
              <Users className="size-4" />
              {t.dashboard.viewClients}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
