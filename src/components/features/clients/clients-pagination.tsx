"use client"

import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"

function buildUrl(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams(searchParams.toString())
  if (page <= 1) {
    params.delete("page")
  } else {
    params.set("page", String(page))
  }
  const qs = params.toString()
  return qs ? `/clients?${qs}` : "/clients"
}

function getPageNumbers(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }
  const pages = new Set<number>([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort(
    (a, b) => a - b
  )
  const result: (number | "ellipsis")[] = []
  let previous = 0
  for (const page of sorted) {
    if (page - previous > 1) {
      result.push("ellipsis")
    }
    result.push(page)
    previous = page
  }
  return result
}

export function ClientsPagination({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  const searchParams = useSearchParams()
  const { t } = useI18n()

  if (totalPages <= 1) return null

  return (
    <nav
      aria-label={t.common.pagination}
      className="flex items-center justify-center gap-1 py-4"
    >
      <Button asChild variant="ghost" size="icon" className="size-8 rounded-full">
        <Link
          href={buildUrl(searchParams, 1)}
          aria-disabled={page === 1}
          tabIndex={page === 1 ? -1 : 0}
          className={cn(page === 1 && "pointer-events-none opacity-50")}
          aria-label={t.common.firstPage}
        >
          <ChevronsLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          <span className="sr-only">{t.common.firstPage}</span>
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon" className="size-8 rounded-full">
        <Link
          href={buildUrl(searchParams, page - 1)}
          aria-disabled={page === 1}
          tabIndex={page === 1 ? -1 : 0}
          className={cn(page === 1 && "pointer-events-none opacity-50")}
          aria-label={t.common.previousPage}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="sr-only">{t.common.previousPage}</span>
        </Link>
      </Button>

      {getPageNumbers(page, totalPages).map((item, index) =>
        item === "ellipsis" ? (
          <span key={`e-${index}`} className="px-1 text-sm text-muted-foreground" aria-hidden="true">
            …
          </span>
        ) : (
          <Button
            key={item}
            asChild
            variant={item === page ? "default" : "ghost"}
            size="icon"
            className={cn("size-8 rounded-full tabular-nums", item === page && "shadow-soft")}
            aria-current={item === page ? "page" : undefined}
          >
            <Link href={buildUrl(searchParams, item)} aria-label={`${"Page"} ${item}`}>{item}</Link>
          </Button>
        )
      )}

      <Button asChild variant="ghost" size="icon" className="size-8 rounded-full">
        <Link
          href={buildUrl(searchParams, page + 1)}
          aria-disabled={page === totalPages}
          tabIndex={page === totalPages ? -1 : 0}
          className={cn(
            page === totalPages && "pointer-events-none opacity-50"
          )}
          aria-label={t.common.nextPage}
        >
          <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          <span className="sr-only">{t.common.nextPage}</span>
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon" className="size-8 rounded-full">
        <Link
          href={buildUrl(searchParams, totalPages)}
          aria-disabled={page === totalPages}
          tabIndex={page === totalPages ? -1 : 0}
          className={cn(
            page === totalPages && "pointer-events-none opacity-50"
          )}
          aria-label={t.common.lastPage}
        >
          <ChevronsRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          <span className="sr-only">{t.common.lastPage}</span>
        </Link>
      </Button>
    </nav>
  )
}
