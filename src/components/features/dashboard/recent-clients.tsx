"use client"

import Link from "next/link"
import { format } from "date-fns"
import { ChevronRight } from "lucide-react"
import type { getDashboardData } from "@/server/services/dashboard.service"
import { ClientStatusBadge } from "@/components/features/clients/client-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useI18n } from "@/lib/i18n/client"
import { getGoalLabel } from "@/lib/i18n/labels"
import type { Goal } from "@/lib/db/enums"

type RecentClients = Awaited<
  ReturnType<typeof getDashboardData>
>["recentClients"]

export function RecentClients({ clients }: { clients: RecentClients }) {
  const { t, locale } = useI18n()
  if (clients.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-11 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.clients.columns.name}</TableHead>
            <TableHead className="h-11 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.clients.columns.phone}</TableHead>
            <TableHead className="h-11 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.clients.columns.goal}</TableHead>
            <TableHead className="h-11 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.clients.columns.status}</TableHead>
            <TableHead className="h-11 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.clients.columns.createdAt}</TableHead>
            <TableHead className="h-11 text-end text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.view}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="group">
              <TableCell className="py-3.5 font-medium">
                {client.fullName ?? t.admin.clients.invitedClient}
              </TableCell>
              <TableCell className="py-3.5 text-muted-foreground tabular-nums">
                <span dir="ltr">{client.phone ?? "—"}</span>
              </TableCell>
              <TableCell className="py-3.5">
                {client.goal ? (
                  <Badge variant="outline" className="font-medium">{getGoalLabel(client.goal as Goal, locale)}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="py-3.5">
                <ClientStatusBadge status={client.status} />
              </TableCell>
              <TableCell className="py-3.5 text-muted-foreground tabular-nums">
                {format(client.createdAt, "MMM d, yyyy")}
              </TableCell>
              <TableCell className="py-3.5 text-end">
                <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5">
                  <Link href={`/clients/${client.id}`}>
                    {t.common.view}
                    <ChevronRight className="size-4 rtl:-scale-x-100 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function RecentClientsSkeleton() {
  return (
    <div className="space-y-2 p-1">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 py-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
}
