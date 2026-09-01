"use client"

import Link from "next/link"
import { format } from "date-fns"
import { ChevronRight, Flame, Target, Trophy } from "lucide-react"
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

const AVATAR_COLORS = [
  "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
  "bg-energy-100 text-energy-700 dark:bg-energy-900/30 dark:text-energy-300",
  "bg-muscle-100 text-muscle-700 dark:bg-muscle-900/30 dark:text-muscle-300",
  "bg-performance-100 text-performance-700 dark:bg-performance-900/30 dark:text-performance-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
]

function getInitials(name: string | null) {
  if (!name) return "؟"
  return name.split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]!.toUpperCase()).join("")
}
function getAvatarColor(id: string) {
  let h=0
  for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0
  return AVATAR_COLORS[h%AVATAR_COLORS.length]!
}

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

export function RecentClientsVisual({ clients }: { clients: RecentClients }) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  if (clients.length === 0) return null
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {clients.map((client, idx) => (
        <Link
          key={client.id}
          href={`/clients/${client.id}`}
          className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover hover:border-brand-200 dark:hover:border-brand-800/50 animate-slide-soft opacity-0 card-lift"
          style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "forwards" }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent opacity-60" aria-hidden="true" />
          <div className="flex items-start gap-3">
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ring-1 ring-black/5 dark:ring-white/10 ${getAvatarColor(client.id)}`}>
              {getInitials(client.fullName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold leading-tight group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                {client.fullName ?? t.admin.clients.invitedClient}
              </p>
              <p className="truncate text-xs text-muted-foreground tabular-nums" dir="ltr">
                {client.phone ?? (isAr ? "بدون تليفون" : "no phone")}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {client.goal ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-700 ring-1 ring-brand-500/15 dark:bg-brand-500/15 dark:text-brand-300">
                    <Target className="size-3" />
                    {getGoalLabel(client.goal as Goal, locale)}
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">—</span>
                )}
                <ClientStatusBadge status={client.status} />
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 group-hover:text-brand-500 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all rtl:-scale-x-100 mt-1" />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Trophy className="size-3 text-energy-500" />
              {format(client.createdAt, "MMM d")}
            </span>
            <span className="text-xs font-medium text-brand-600 dark:text-brand-400 group-hover:gap-1.5 inline-flex items-center gap-1">
              {isAr ? "شوف البروفايل" : "View profile"}
              <ChevronRight className="size-3 rtl:-scale-x-100" />
            </span>
          </div>
        </Link>
      ))}
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
