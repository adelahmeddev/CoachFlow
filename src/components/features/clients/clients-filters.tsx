"use client"

import { useCallback, useRef, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, RotateCcw, Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/client"
import {
  getClientStatusLabel,
  getGoalLabel,
} from "@/lib/i18n/labels"
import { ClientStatus, Goal } from "@/generated/prisma/enums"

const GOAL_VALUES = [
  Goal.WEIGHT_LOSS,
  Goal.MUSCLE_BUILDING,
  Goal.STRENGTH,
  Goal.GENERAL_FITNESS,
  Goal.WEIGHT_GAIN,
  Goal.REHAB,
]

const STATUS_VALUES = Object.values(ClientStatus)

export function ClientsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useI18n()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const currentStatus = searchParams.get("status") ?? "ALL"
  const currentGoal = searchParams.get("goal") ?? "ALL"
  const currentQ = searchParams.get("q") ?? ""

  const hasFilters =
    currentQ !== "" || currentStatus !== "ALL" || currentGoal !== "ALL"

  const activeCount = [currentStatus, currentGoal].filter(
    (v) => v !== "ALL"
  ).length

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value && value !== "ALL") {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      params.delete("page")
      const qs = params.toString()
      startTransition(() =>
        router.replace(qs ? `/clients?${qs}` : "/clients")
      )
    },
    [router, searchParams]
  )

  const filterContent = (
    <>
      <Select
        value={currentStatus}
        onValueChange={(value) => updateParams({ status: value })}
      >
        <SelectTrigger className="w-full min-w-[140px] md:w-[160px] bg-card shadow-soft" aria-label={t.clients.filterStatus}>
          <SelectValue placeholder={t.clients.filterStatus} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t.common.all}</SelectItem>
          {STATUS_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {getClientStatusLabel(value, locale)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentGoal}
        onValueChange={(value) => updateParams({ goal: value })}
      >
        <SelectTrigger className="w-full min-w-[140px] md:w-[160px] bg-card shadow-soft" aria-label={t.clients.filterGoal}>
          <SelectValue placeholder={t.clients.filterGoal} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t.common.all}</SelectItem>
          {GOAL_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {getGoalLabel(value, locale)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            updateParams({ q: null, status: null, goal: null })
          }
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {t.clients.clearFilters}
        </Button>
      )}
    </>
  )

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card/60 p-3 shadow-soft backdrop-blur-sm sm:flex-row sm:items-center sm:p-3.5">
      <form
        className="relative flex-1 sm:max-w-sm"
        onSubmit={(e) => {
          e.preventDefault()
          updateParams({ q: searchRef.current?.value ?? null })
        }}
        role="search"
        aria-label={t.clients.searchPlaceholder}
      >
        <label htmlFor="clients-search" className="sr-only">
          {t.clients.searchPlaceholder}
        </label>
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          ref={searchRef}
          id="clients-search"
          key={currentQ}
          defaultValue={currentQ}
          placeholder={t.clients.searchPlaceholder}
          className="h-10 ps-9 pe-9 bg-card shadow-soft"
          autoComplete="off"
          inputMode="search"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          className="absolute end-1 top-1/2 size-7 -translate-y-1/2"
          aria-label={t.common.search ?? "بحث"}
        >
          <Search className="size-3.5" aria-hidden="true" />
        </Button>
      </form>

      {/* Desktop filters */}
      <div className="hidden flex-wrap items-center gap-2.5 md:flex">
        <div className="h-6 w-px bg-border" aria-hidden="true" />
        {filterContent}
        {isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />}
      </div>

      {/* Mobile filter sheet */}
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-card shadow-soft">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              {t.common.filters}
              {activeCount > 0 && (
                <Badge variant="secondary" className="ms-1 h-5 min-w-5 justify-center px-1.5 text-xs font-semibold">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="start" className="w-[320px] overflow-y-auto sm:max-w-[320px]">
            <SheetHeader>
              <SheetTitle>{t.common.filters}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 p-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t.clients.filterStatus}</p>
                {filterContent}
              </div>
            </div>
          </SheetContent>
        </Sheet>
        {isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />}
      </div>
    </div>
  )
}
