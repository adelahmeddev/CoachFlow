import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getI18n } from "@/lib/i18n"
import {
  getAdminClients,
  getAdminTrainerOptions,
} from "@/server/services/admin.service"
import { adminClientsQuerySchema } from "@/lib/validations/admin"
import { Card, CardContent } from "@/components/ui/card"
import { AdminClientsFilters } from "@/components/features/admin/admin-clients-filters"
import { AdminClientsTable } from "@/components/features/admin/admin-clients-table"
import { AdminPagination } from "@/components/features/admin/admin-pagination"
import { AdminEmptyState } from "@/components/features/admin/admin-empty-state"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.admin.clients.title }
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    notFound()
  }

  const { t } = await getI18n()

  const rawParams = await searchParams
  const parsed = adminClientsQuerySchema.safeParse({
    q: rawParams.q,
    trainerId: rawParams.trainerId,
    goal: rawParams.goal,
    status: rawParams.status,
    page: rawParams.page,
    perPage: rawParams.perPage,
  })
  const params = parsed.success ? parsed.data : { page: 1, perPage: 10 }

  const [result, trainerOptions] = await Promise.all([
    getAdminClients(params),
    getAdminTrainerOptions(),
  ])

  const hasFilters = Boolean(params.q || params.trainerId || params.goal || params.status)
  const showNoResults = hasFilters && result.clients.length === 0
  const showNoClients = !hasFilters && result.total === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.admin.clients.title}
        </h1>
        <p className="text-muted-foreground">{t.admin.clients.subtitle}</p>
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <AdminClientsFilters trainers={trainerOptions} />
      </Suspense>

      <Card>
        <CardContent className="p-0">
          {showNoClients ? (
            <AdminEmptyState
              title={t.admin.clients.emptyTitle}
              description={t.admin.clients.emptyDescription}
            />
          ) : showNoResults ? (
            <AdminEmptyState
              title={t.admin.clients.noResultsTitle}
              description={t.admin.clients.noResultsDescription}
            />
          ) : (
            <AdminClientsTable clients={result.clients} />
          )}
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        <AdminPagination
          basePath="/admin/clients"
          page={result.page}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  )
}
