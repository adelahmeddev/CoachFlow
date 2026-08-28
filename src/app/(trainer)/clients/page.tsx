import { Suspense } from "react"
import { getCurrentSession } from "@/server/auth"
import { getTrainerClients } from "@/server/services/client.service"
import { clientsListQuerySchema } from "@/lib/validations/client"
import { ClientsPageHeader } from "@/components/features/clients/clients-page-header"
import { ClientsFilters } from "@/components/features/clients/clients-filters"
import { ClientsTable } from "@/components/features/clients/clients-table"
import { ClientsPagination } from "@/components/features/clients/clients-pagination"
import { ClientsEmptyState } from "@/components/features/clients/clients-empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { getI18n } from "@/lib/i18n"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return {
    title: t.clients.title,
    description: t.clients.subtitle,
  }
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getCurrentSession()
  const trainerProfileId = session?.user.trainerProfileId

  const rawParams = await searchParams
  const parsed = clientsListQuerySchema.safeParse({
    q: rawParams.q,
    goal: rawParams.goal,
    status: rawParams.status,
    page: rawParams.page,
    perPage: rawParams.perPage,
  })
  const params = parsed.success ? parsed.data : { page: 1, perPage: 10 }

  if (!trainerProfileId) {
    return (
      <div className="space-y-6">
        <ClientsPageHeader />
        <ClientsEmptyState variant="no-clients" />
      </div>
    )
  }

  const result = await getTrainerClients(trainerProfileId, params)

  const hasFilters = Boolean(params.q) || Boolean(params.goal) || Boolean(params.status)
  const showNoResults = hasFilters && result.clients.length === 0
  const showNoClients = !hasFilters && result.total === 0

  return (
    <div className="space-y-6">
      <ClientsPageHeader />

      <Suspense fallback={<div className="h-10 rounded-xl bg-muted/30" />}>
        <ClientsFilters />
      </Suspense>

      <Card className="overflow-hidden border bg-card shadow-soft">
        <CardContent className="p-0">
          {showNoClients ? (
            <ClientsEmptyState variant="no-clients" />
          ) : showNoResults ? (
            <ClientsEmptyState variant="no-results" />
          ) : (
            <ClientsTable clients={result.clients} />
          )}
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        <ClientsPagination page={result.page} totalPages={result.totalPages} />
      </Suspense>
    </div>
  )
}
