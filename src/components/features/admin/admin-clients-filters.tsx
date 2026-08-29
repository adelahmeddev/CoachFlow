"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useI18n } from "@/lib/i18n/client"
import { getClientStatusLabel, getGoalLabel } from "@/lib/i18n/labels"
import { ClientStatus, Goal } from "@/lib/db/enums"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminSearchInput } from "@/components/features/admin/admin-search-input"

const GOAL_VALUES = [
  Goal.WEIGHT_LOSS,
  Goal.MUSCLE_BUILDING,
  Goal.STRENGTH,
  Goal.GENERAL_FITNESS,
  Goal.WEIGHT_GAIN,
  Goal.REHAB,
]

const STATUS_VALUES = Object.values(ClientStatus)

export function AdminClientsFilters({
  trainers,
}: {
  trainers: { id: string; fullName: string }[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useI18n()
  const [open, setOpen] = useState(false)

  const currentTrainer = searchParams.get("trainerId") ?? "ALL"
  const currentGoal = searchParams.get("goal") ?? "ALL"
  const currentStatus = searchParams.get("status") ?? "ALL"

  const hasFilters =
    currentTrainer !== "ALL" || currentGoal !== "ALL" || currentStatus !== "ALL"

  const activeCount = [currentTrainer, currentGoal, currentStatus].filter(
    (v) => v !== "ALL"
  ).length

  const basePath = "/admin/clients"

  function updateParams(patch: Record<string, string | null>) {
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
    router.replace(qs ? `${basePath}?${qs}` : basePath)
  }

  const filterContent = (
    <>
      <Select
        value={currentTrainer}
        onValueChange={(value) => updateParams({ trainerId: value })}
      >
        <SelectTrigger className="w-full" aria-label={t.admin.clients.filterTrainer}>
          <SelectValue placeholder={t.admin.clients.filterTrainer} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t.admin.clients.allTrainers}</SelectItem>
          {trainers.map((trainer) => (
            <SelectItem key={trainer.id} value={trainer.id}>
              {trainer.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentGoal}
        onValueChange={(value) => updateParams({ goal: value })}
      >
        <SelectTrigger className="w-full" aria-label={t.admin.clients.filterGoal}>
          <SelectValue placeholder={t.admin.clients.filterGoal} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t.admin.clients.allGoals}</SelectItem>
          {GOAL_VALUES.map((goal) => (
            <SelectItem key={goal} value={goal}>
              {getGoalLabel(goal, locale)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentStatus}
        onValueChange={(value) => updateParams({ status: value })}
      >
        <SelectTrigger className="w-full" aria-label={t.admin.clients.filterStatus}>
          <SelectValue placeholder={t.admin.clients.filterStatus} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t.admin.clients.allStatuses}</SelectItem>
          {STATUS_VALUES.map((status) => (
            <SelectItem key={status} value={status}>
              {getClientStatusLabel(status, locale)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            updateParams({ trainerId: null, goal: null, status: null })
          }
        >
          {t.admin.clients.clearFilters}
        </Button>
      )}
    </>
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      <AdminSearchInput
        basePath={basePath}
        placeholder={t.admin.clients.searchPlaceholder}
      />

      {/* Desktop filters */}
      <div className="hidden flex-wrap items-center gap-3 md:flex">
        {filterContent}
      </div>

      {/* Mobile filter sheet */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="size-4" />
              {t.common.filters}
              {activeCount > 0 && (
                <Badge variant="secondary" className="ms-1 h-5 px-1.5 text-xs">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="start" className="w-[320px] overflow-y-auto sm:max-w-[320px]">
            <SheetHeader>
              <SheetTitle>{t.common.filters}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-3 p-4">
              {filterContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
