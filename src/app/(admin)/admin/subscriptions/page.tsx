import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getI18n } from "@/lib/i18n"
import { adminCoachSubscriptionsQuerySchema } from "@/lib/validations/admin"
import { listCoachSubscriptions } from "@/server/services/coach-subscription.service"
import { Card, CardContent } from "@/components/ui/card"
import { AdminCoachSubscriptionsFilters } from "@/components/features/admin/admin-coach-subscriptions-filters"
import { AdminCoachSubscriptionsTable } from "@/components/features/admin/admin-coach-subscriptions-table"
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
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    notFound()
  }

  const { t } = await getI18n()

  const rawParams = await searchParams
  const parsed = adminCoachSubscriptionsQuerySchema.safeParse({
    q: rawParams.q,
    status: rawParams.status,
    filter: rawParams.filter,
    page: rawParams.page,
    perPage: rawParams.perPage,
  })
  const params = parsed.success ? parsed.data : { page: 1, perPage: 10 }

  const result = await listCoachSubscriptions(params as { status?: import("@/lib/db/enums").CoachSubscriptionStatus; filter?: string; q?: string; page?: number; perPage?: number })

  const hasFilters = Boolean(params.q || params.status || (params as { filter?: string }).filter)
  const showNoResults = hasFilters && result.subscriptions.length === 0
  const showNoSubscriptions = !hasFilters && result.total === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Coach Subscriptions
        </h1>
        <p className="text-muted-foreground">Admin-controlled manual subscriptions — active, expired, expiring soon, suspended.</p>
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <AdminCoachSubscriptionsFilters />
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
            <AdminCoachSubscriptionsTable subscriptions={result.subscriptions as unknown as never} />
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
