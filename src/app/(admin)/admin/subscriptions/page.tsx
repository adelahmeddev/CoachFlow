import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getI18n } from "@/lib/i18n"
import { getAdminSubscriptions } from "@/server/services/admin.service"
import { adminSubscriptionsQuerySchema } from "@/lib/validations/admin"
import { Card, CardContent } from "@/components/ui/card"
import { AdminSubscriptionsFilters } from "@/components/features/admin/admin-subscriptions-filters"
import { AdminSubscriptionsTable } from "@/components/features/admin/admin-subscriptions-table"
import { AdminPagination } from "@/components/features/admin/admin-pagination"
import { AdminEmptyState } from "@/components/features/admin/admin-empty-state"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.admin.subscriptions.title }
}

export default async function AdminSubscriptionsPage({
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
  const parsed = adminSubscriptionsQuerySchema.safeParse({
    q: rawParams.q,
    status: rawParams.status,
    paymentStatus: rawParams.paymentStatus,
    page: rawParams.page,
    perPage: rawParams.perPage,
  })
  const params = parsed.success ? parsed.data : { page: 1, perPage: 10 }

  const result = await getAdminSubscriptions(params)

  const hasFilters = Boolean(params.q || params.status || params.paymentStatus)
  const showNoResults = hasFilters && result.subscriptions.length === 0
  const showNoSubscriptions = !hasFilters && result.total === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.admin.subscriptions.title}
        </h1>
        <p className="text-muted-foreground">{t.admin.subscriptions.subtitle}</p>
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <AdminSubscriptionsFilters />
      </Suspense>

      <Card>
        <CardContent className="p-0">
          {showNoSubscriptions ? (
            <AdminEmptyState
              title={t.admin.subscriptions.emptyTitle}
              description={t.admin.subscriptions.emptyDescription}
            />
          ) : showNoResults ? (
            <AdminEmptyState
              title={t.admin.subscriptions.noResultsTitle}
              description={t.admin.subscriptions.noResultsDescription}
            />
          ) : (
            <AdminSubscriptionsTable subscriptions={result.subscriptions} />
          )}
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        <AdminPagination
          basePath="/admin/subscriptions"
          page={result.page}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  )
}
