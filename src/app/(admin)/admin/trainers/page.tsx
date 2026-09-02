import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getI18n } from "@/lib/i18n"
import { getAdminTrainers } from "@/server/services/admin.service"
import { adminTrainersQuerySchema } from "@/lib/validations/admin"
import { Card, CardContent } from "@/components/ui/card"
import { CreateTrainerDialog } from "@/components/features/admin/create-trainer-dialog"
import { AdminTrainersTable } from "@/components/features/admin/admin-trainers-table"
import { AdminSearchInput } from "@/components/features/admin/admin-search-input"
import { AdminPagination } from "@/components/features/admin/admin-pagination"
import { AdminEmptyState } from "@/components/features/admin/admin-empty-state"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.admin.trainers.title }
}

export default async function AdminTrainersPage({
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
  const parsed = adminTrainersQuerySchema.safeParse({
    q: rawParams.q,
    page: rawParams.page,
    perPage: rawParams.perPage,
  })
  const params = parsed.success ? parsed.data : { page: 1, perPage: 10 }

  const result = await getAdminTrainers(params)

  const hasFilters = Boolean(params.q)
  const showNoResults = hasFilters && result.trainers.length === 0
  const showNoTrainers = !hasFilters && result.total === 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.admin.trainers.title}
          </h1>
          <p className="text-muted-foreground">{t.admin.trainers.subtitle}</p>
        </div>
        <CreateTrainerDialog />
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <AdminSearchInput
          basePath="/admin/trainers"
          placeholder={t.admin.trainers.searchPlaceholder}
        />
      </Suspense>

      <Card>
        <CardContent className="p-0">
          {showNoTrainers ? (
            <AdminEmptyState
              title={t.admin.trainers.emptyTitle}
              description={t.admin.trainers.emptyDescription}
            />
          ) : showNoResults ? (
            <AdminEmptyState
              title={t.admin.trainers.noResultsTitle}
              description={t.admin.trainers.noResultsDescription}
            />
          ) : (
            <AdminTrainersTable trainers={result.trainers} />
          )}
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        <AdminPagination
          basePath="/admin/trainers"
          page={result.page}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  )
}
