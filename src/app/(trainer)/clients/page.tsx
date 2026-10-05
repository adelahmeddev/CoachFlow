import { Suspense } from "react"
import { getCurrentSession } from "@/server/auth"
import { getTrainerClients } from "@/server/services/client.service"
import { clientsListQuerySchema } from "@/lib/validations/client"
import { ClientsPageHeader } from "@/components/features/clients/clients-page-header"
import { ClientsFilters } from "@/components/features/clients/clients-filters"
import { ClientsGrid } from "@/components/features/clients/clients-grid"
import { ClientsPagination } from "@/components/features/clients/clients-pagination"
import { ClientsEmptyState } from "@/components/features/clients/clients-empty-state"
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
  const qParsed = typeof rawParams.q === "string" ? rawParams.q.trim().slice(0, 100) : undefined
  const goalResult = clientsListQuerySchema.shape.goal.safeParse(rawParams.goal)
  const statusResult = clientsListQuerySchema.shape.status.safeParse(rawParams.status)
  const addedWithinResult = clientsListQuerySchema.shape.addedWithin.safeParse(rawParams.addedWithin)
  const pageResult = clientsListQuerySchema.shape.page.safeParse(rawParams.page)
  const perPageResult = clientsListQuerySchema.shape.perPage.safeParse(rawParams.perPage)

  const params = {
    q: qParsed || undefined,
    goal: goalResult.success ? goalResult.data : undefined,
    status: statusResult.success ? statusResult.data : undefined,
    addedWithin: addedWithinResult.success ? addedWithinResult.data : undefined,
    page: pageResult.success ? pageResult.data : 1,
    perPage: perPageResult.success ? perPageResult.data : 10,
  }

  if (!trainerProfileId) {
    return (
      <div className="space-y-6">
        <ClientsPageHeader />
        <ClientsEmptyState variant="no-clients" />
      </div>
    )
  }

  const result = await getTrainerClients(trainerProfileId, params)

  const hasFilters =
    Boolean(params.q) ||
    Boolean(params.goal) ||
    Boolean(params.status) ||
    Boolean(params.addedWithin)
  const showNoResults = hasFilters && result.clients.length === 0
  const showNoClients = !hasFilters && result.total === 0

  return (
    <div className="space-y-6">
      <ClientsPageHeader />

      <Suspense fallback={<div className="h-10 rounded-xl bg-muted/30" />}>
        <ClientsFilters />
      </Suspense>

      {showNoClients ? (
        <ClientsEmptyState variant="no-clients" />
      ) : showNoResults ? (
        <ClientsEmptyState variant="no-results" />
      ) : (
        <ClientsGrid clients={result.clients} />
      )}

      <Suspense fallback={null}>
        <ClientsPagination page={result.page} totalPages={result.totalPages} />
      </Suspense>
    </div>
  )
}
