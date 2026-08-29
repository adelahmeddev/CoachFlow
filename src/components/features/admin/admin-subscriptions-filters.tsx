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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/client"
import { getPaymentStatusLabel, getSubscriptionStatusLabel } from "@/lib/i18n/labels"
import { PaymentStatus, SubscriptionStatus } from "@/lib/db/enums"
import { AdminSearchInput } from "@/components/features/admin/admin-search-input"

const STATUS_VALUES = Object.values(SubscriptionStatus)
const PAYMENT_VALUES = Object.values(PaymentStatus)

export function AdminSubscriptionsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useI18n()
  const [open, setOpen] = useState(false)

  const currentStatus = searchParams.get("status") ?? "ALL"
  const currentPayment = searchParams.get("paymentStatus") ?? "ALL"

  const hasFilters = currentStatus !== "ALL" || currentPayment !== "ALL"

  const activeCount = [currentStatus, currentPayment].filter(
    (v) => v !== "ALL"
  ).length

  const basePath = "/admin/subscriptions"

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
        value={currentStatus}
        onValueChange={(value) => updateParams({ status: value })}
      >
        <SelectTrigger className="w-full" aria-label={t.admin.subscriptions.filterStatus}>
          <SelectValue placeholder={t.admin.subscriptions.filterStatus} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t.admin.subscriptions.allStatuses}</SelectItem>
          {STATUS_VALUES.map((status) => (
            <SelectItem key={status} value={status}>
              {getSubscriptionStatusLabel(status, locale)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentPayment}
        onValueChange={(value) => updateParams({ paymentStatus: value })}
      >
        <SelectTrigger className="w-full" aria-label={t.admin.subscriptions.filterPayment}>
          <SelectValue placeholder={t.admin.subscriptions.filterPayment} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t.admin.subscriptions.allPayments}</SelectItem>
          {PAYMENT_VALUES.map((payment) => (
            <SelectItem key={payment} value={payment}>
              {getPaymentStatusLabel(payment, locale)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => updateParams({ status: null, paymentStatus: null })}
        >
          {t.admin.subscriptions.clearFilters}
        </Button>
      )}
    </>
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      <AdminSearchInput
        basePath={basePath}
        placeholder={t.admin.subscriptions.searchPlaceholder}
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
