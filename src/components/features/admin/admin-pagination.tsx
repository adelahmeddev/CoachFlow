"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useI18n } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function buildUrl(
  basePath: string,
  searchParams: URLSearchParams,
  page: number
) {
  const params = new URLSearchParams(searchParams.toString())
  if (page <= 1) {
    params.delete("page")
  } else {
    params.set("page", String(page))
  }
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export function AdminPagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string
  page: number
  totalPages: number
}) {
  const searchParams = useSearchParams()
  const { t } = useI18n()

  if (totalPages <= 1) return null

  const disabledClass = "pointer-events-none opacity-50"

  return (
    <nav
      aria-label={t.common.pagination}
      className="flex items-center justify-center gap-1 py-4"
    >
      {/* Mobile: simplified pagination */}
      <div className="flex items-center gap-2 md:hidden">
        <Button asChild variant="outline" size="sm" disabled={page === 1}>
          <Link
            href={buildUrl(basePath, searchParams, page - 1)}
            aria-disabled={page === 1}
            tabIndex={page === 1 ? -1 : 0}
          >
            <ChevronLeft className="size-4 rtl:-scale-x-100" />
            {t.common.previousPage}
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button asChild variant="outline" size="sm" disabled={page === totalPages}>
          <Link
            href={buildUrl(basePath, searchParams, page + 1)}
            aria-disabled={page === totalPages}
            tabIndex={page === totalPages ? -1 : 0}
          >
            {t.common.nextPage}
            <ChevronRight className="size-4 rtl:-scale-x-100" />
          </Link>
        </Button>
      </div>

      {/* Desktop: full pagination */}
      <div className="hidden items-center gap-1 md:flex">
        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link
            href={buildUrl(basePath, searchParams, 1)}
            aria-disabled={page === 1}
            tabIndex={page === 1 ? -1 : 0}
            className={cn(page === 1 && disabledClass)}
          >
            <ChevronLeft className="size-4 rtl:-scale-x-100" />
            <span className="sr-only">{t.common.firstPage}</span>
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link
            href={buildUrl(basePath, searchParams, page - 1)}
            aria-disabled={page === 1}
            tabIndex={page === 1 ? -1 : 0}
            className={cn(page === 1 && disabledClass)}
          >
            <ChevronLeft className="size-4 rtl:-scale-x-100" />
            <span className="sr-only">{t.common.previousPage}</span>
          </Link>
        </Button>

        <span className="px-2 text-sm text-muted-foreground">
          {page} / {totalPages}
        </span>

        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link
            href={buildUrl(basePath, searchParams, page + 1)}
            aria-disabled={page === totalPages}
            tabIndex={page === totalPages ? -1 : 0}
            className={cn(page === totalPages && disabledClass)}
          >
            <ChevronRight className="size-4 rtl:-scale-x-100" />
            <span className="sr-only">{t.common.nextPage}</span>
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link
            href={buildUrl(basePath, searchParams, totalPages)}
            aria-disabled={page === totalPages}
            tabIndex={page === totalPages ? -1 : 0}
            className={cn(page === totalPages && disabledClass)}
          >
            <ChevronRight className="size-4 rtl:-scale-x-100" />
            <span className="sr-only">{t.common.lastPage}</span>
          </Link>
        </Button>
      </div>
    </nav>
  )
}
