"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CoachSubscriptionStatus } from "@/lib/db/enums"
import { AdminSearchInput } from "@/components/features/admin/admin-search-input"

export function AdminCoachSubscriptionsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("status") ?? "ALL"
  const filter = searchParams.get("filter") ?? "ALL"
  const basePath = "/admin/subscriptions"

  function updateStatus(status: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (status && status !== "ALL") params.set("status", status)
    else params.delete("status")
    // clear expiring filter when status changes
    if (status !== "ALL") params.delete("filter")
    params.delete("page")
    const qs = params.toString()
    router.replace(qs ? `${basePath}?${qs}` : basePath)
  }

  function updateFilter(v: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (v && v !== "ALL") params.set("filter", v)
    else params.delete("filter")
    if (v === "expiring_soon") params.delete("status")
    params.delete("page")
    const qs = params.toString()
    router.replace(qs ? `${basePath}?${qs}` : basePath)
  }

  const activeFilter = filter !== "ALL" ? filter : current

  return (
    <div className="flex flex-wrap items-center gap-3">
      <AdminSearchInput basePath={basePath} placeholder="Search coach..." />
      <Select value={activeFilter} onValueChange={(v)=>{
        if (v==="expiring_soon") updateFilter(v)
        else { updateFilter("ALL"); updateStatus(v)}
      }}>
        <SelectTrigger className="w-[170px]"><SelectValue placeholder="Filter" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="expiring_soon">Expiring Soon (7d)</SelectItem>
          <SelectItem value="EXPIRED">Expired</SelectItem>
          <SelectItem value="SUSPENDED">Suspended</SelectItem>
        </SelectContent>
      </Select>
      {activeFilter !== "ALL" && <Button variant="ghost" size="sm" onClick={()=> {updateStatus("ALL"); updateFilter("ALL")}}>Clear</Button>}
    </div>
  )
}
