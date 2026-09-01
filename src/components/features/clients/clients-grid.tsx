"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { differenceInYears } from "date-fns"
import { ChevronRight, Trash2, Flame, Target, Trophy, MessageCircle, Dumbbell, Calendar, User } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ClientsGridProps = {
  clients: Awaited<ReturnType<typeof getTrainerClients>>["clients"]
}

function getInitials(fullName: string | null) {
  if (!fullName) return "؟"
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

const AVATAR_COLORS = [
  "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 ring-brand-500/10",
  "bg-energy-100 text-energy-700 dark:bg-energy-900/30 dark:text-energy-300 ring-energy-500/10",
  "bg-muscle-100 text-muscle-700 dark:bg-muscle-900/30 dark:text-muscle-300 ring-muscle-500/10",
  "bg-performance-100 text-performance-700 dark:bg-performance-900/30 dark:text-performance-300 ring-performance-500/10",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 ring-sky-500/10",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 ring-violet-500/10",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 ring-amber-500/10",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 ring-teal-500/10",
]

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!
}

// Mock streak — deterministic from id
function getMockStreak(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0
  const r = h % 10
  if (r < 4) return 0
  if (r < 7) return (h % 6) + 1
  if (r < 9) return (h % 14) + 7
  return (h % 20) + 14
}

export function ClientsGrid({ clients }: ClientsGridProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const isAr = locale === "ar"
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client, idx) => {
          const streak = getMockStreak(client.id)
          const age = client.birthDate ? differenceInYears(new Date(), client.birthDate) : null
          const hasPackage = !!client.subscription
          return (
            <div
              key={client.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover hover:border-brand-200 dark:hover:border-brand-900/30"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* top accent */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent opacity-60" aria-hidden="true" />
              {/* hover glow */}
              <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br from-brand-500/10 to-energy-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />

              {/* HEADER */}
              <div className="relative flex items-start gap-3 p-4 pb-3">
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ring-1 ${getAvatarColor(client.id)}`}>
                  {getInitials(client.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/clients/${client.id}`} className="group/link">
                    <p className="truncate text-sm font-bold leading-tight group-hover/link:text-brand-600 dark:group-hover/link:text-brand-400 transition-colors">
                      {client.fullName ?? t.admin.clients.invitedClient}
                    </p>
                  </Link>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {client.phone ? (
                      <span dir="ltr" className="tabular-nums truncate">{client.phone}</span>
                    ) : (
                      <span className="text-muted-foreground/60">{isAr ? "بدون تليفون" : "no phone"}</span>
                    )}
                    {age !== null && (
                      <>
                        <span className="size-1 rounded-full bg-muted-foreground/30" aria-hidden="true" />
                        <span className="tabular-nums">{age} {isAr ? "سنة" : "y"}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <ClientGoalBadge goal={client.goal} />
                    <ClientStatusBadge status={client.status} />
                  </div>
                </div>
                {streak > 0 && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-energy-500 to-brand-500 px-2 py-0.5 text-xs font-bold text-white shadow-soft">
                    <Flame className="size-3 fill-white/20" />
                    {streak}
                  </span>
                )}
              </div>

              {/* PACKAGE / PROGRESS */}
              <div className="px-4 pb-3 space-y-2">
                <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Trophy className="size-3.5 text-energy-600" />
                    {isAr ? "الباقة" : "Package"}
                  </span>
                  <span className="shrink-0">
                    {client.subscription ? (
                      <SubscriptionBadge planName={client.subscription.planName} status={client.subscription.status} />
                    ) : (
                      <NoSubscriptionBadge />
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="rounded-xl border bg-card p-2">
                    <Target className="mx-auto size-3.5 text-brand-500 mb-1" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{isAr ? "الهدف" : "Goal"}</p>
                    <p className="mt-0.5 truncate text-xs font-medium leading-none">{client.goal ? t.enums.goals[client.goal as keyof typeof t.enums.goals] ?? client.goal : "—"}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-2">
                    <Calendar className="mx-auto size-3.5 text-performance-500 mb-1" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{isAr ? "انضم" : "Joined"}</p>
                    <p className="mt-0.5 text-xs font-medium leading-none tabular-nums">{formatDate(client.createdAt, locale)}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-2">
                    <Dumbbell className="mx-auto size-3.5 text-muscle-500 mb-1" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{isAr ? "الحالة" : "Status"}</p>
                    <p className="mt-0.5 truncate text-xs font-medium leading-none">{client.status === "ACTIVE" ? (isAr ? "نشط" : "Active") : client.status === "PENDING_ASSESSMENT" ? (isAr ? "متابعة" : "Check-in") : client.status}</p>
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="mt-auto flex items-center gap-2 border-t bg-muted/20 p-3">
                <Button asChild size="sm" className="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 shadow-soft hover:brightness-110 gap-1.5">
                  <Link href={`/clients/${client.id}`}>
                    <User className="size-4" />
                    {t.clients.viewProfile}
                    <ChevronRight className="size-4 rtl:-scale-x-100 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="icon" className="size-9 shrink-0 rounded-xl bg-card hover:bg-card" aria-label={t.nav.messages}>
                  <Link href={`/messages/${client.id}`}>
                    <MessageCircle className="size-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteTarget(client)}
                  aria-label={t.clients.deleteClient}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          )
        })}
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
