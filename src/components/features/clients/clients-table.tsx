"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { differenceInYears } from "date-fns"
import { ChevronRight, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"
import { formatDate, interpolate } from "@/lib/i18n/format"
import { deleteClientAction } from "@/server/actions/clients"
import type { getTrainerClients } from "@/server/services/client.service"
import { ClientStatusBadge } from "@/components/features/clients/client-status-badge"
import { ClientGoalBadge } from "@/components/features/clients/client-goal-badge"
import {
  SubscriptionBadge,
  NoSubscriptionBadge,
} from "@/components/features/clients/subscription-badge"
import { BasicInfoBadge } from "@/components/features/clients/basic-info-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ClientsTableProps = {
  clients: Awaited<ReturnType<typeof getTrainerClients>>["clients"]
}

function getInitials(fullName: string | null) {
  if (!fullName) return "?"
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

// Deterministic avatar color from client id — hashes id to one of 8 hue classes.
// Same id always produces the same color; no randomness, no storage needed.
const AVATAR_COLORS = [
  "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
  "bg-brand-200 text-brand-800 dark:bg-brand-700/40 dark:text-brand-200",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
]

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const c = t.clients.columns
  const [deleteTarget, setDeleteTarget] = useState<
    Awaited<ReturnType<typeof getTrainerClients>>["clients"][number] | null
  >(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function confirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const result = await deleteClientAction(deleteTarget.id)
    setIsDeleting(false)
    if (!result.ok) {
      toast.error(t.clients.deleteClientFailed)
      return
    }
    toast.success(t.clients.deleteClientSuccess)
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="space-y-3 md:hidden p-3">
        {clients.map((client) => (
          <div
            key={client.id}
            className="rounded-xl border bg-card p-4 shadow-soft transition-shadow hover:shadow-medium"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-black/5 dark:ring-white/10 ${getAvatarColor(client.id)}`} aria-hidden="true">
                {getInitials(client.fullName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-none">
                  {client.fullName ?? t.admin.clients.invitedClient}
                </p>
                {client.phone && (
                  <p className="truncate text-xs tabular-nums text-muted-foreground mt-1">
                    <span dir="ltr">{client.phone}</span>
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs font-medium tabular-nums text-muted-foreground">
                {client.birthDate
                  ? differenceInYears(new Date(), client.birthDate)
                  : "—"}
              </span>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              <ClientGoalBadge goal={client.goal} />
              <ClientStatusBadge status={client.status} />
              {client.subscription ? (
                <SubscriptionBadge
                  planName={client.subscription.planName}
                  status={client.subscription.status}
                />
              ) : (
                <NoSubscriptionBadge />
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <BasicInfoBadge completedAt={client.basicInfoCompletedAt} />
              <span className="tabular-nums">{formatDate(client.createdAt, locale)}</span>
            </div>

            <div className="mt-3 flex gap-2 border-t border-border/60 pt-3">
              <Button asChild variant="outline" size="sm" className="flex-1 shadow-soft">
                <Link href={`/clients/${client.id}`}>
                  {t.clients.viewProfile}
                  <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"
                onClick={() => setDeleteTarget(client)}
                aria-label={t.clients.deleteClient}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.name}</TableHead>
              <TableHead className="h-11 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.age}</TableHead>
              <TableHead className="h-11 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.goal}</TableHead>
              <TableHead className="h-11 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.status}</TableHead>
              <TableHead className="h-11 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.subscription}</TableHead>
              <TableHead className="h-11 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.createdAt}</TableHead>
              <TableHead className="h-11 text-end text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.action}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} className="group">
                <TableCell className="py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-black/5 dark:ring-white/10 ${getAvatarColor(client.id)}`} aria-hidden="true">
                      {getInitials(client.fullName)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium leading-none">
                        {client.fullName ?? t.admin.clients.invitedClient}
                      </p>
                      {client.phone && (
                        <p className="truncate text-xs tabular-nums text-muted-foreground mt-0.5">
                          <span dir="ltr">{client.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3.5 text-muted-foreground tabular-nums">
                  {client.birthDate
                    ? differenceInYears(new Date(), client.birthDate)
                    : "—"}
                </TableCell>
                <TableCell className="py-3.5">
                  <ClientGoalBadge goal={client.goal} />
                </TableCell>
                <TableCell className="py-3.5">
                  <ClientStatusBadge status={client.status} />
                </TableCell>
                <TableCell className="py-3.5">
                  {client.subscription ? (
                    <SubscriptionBadge
                      planName={client.subscription.planName}
                      status={client.subscription.status}
                    />
                  ) : (
                    <NoSubscriptionBadge />
                  )}
                </TableCell>
                <TableCell className="py-3.5 text-muted-foreground tabular-nums">
                  {formatDate(client.createdAt, locale)}
                </TableCell>
                <TableCell className="py-3.5 text-end">
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="outline" size="sm" className="h-8 shadow-soft">
                      <Link href={`/clients/${client.id}`}>
                        {t.clients.viewProfile}
                        <ChevronRight className="size-4 rtl:-scale-x-100 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"
                      onClick={() => setDeleteTarget(client)}
                      aria-label={t.clients.deleteClient}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.clients.deleteClientTitle}</DialogTitle>
            <DialogDescription className="space-y-2">
              <span>
                {deleteTarget
                  ? interpolate(t.clients.deleteClientConfirm, {
                      name: deleteTarget.fullName ?? t.admin.clients.invitedClient,
                    })
                  : ""}
              </span>
              <span className="block text-xs">{t.clients.deleteClientDescription}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? t.common.loading : t.clients.deleteClient}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
