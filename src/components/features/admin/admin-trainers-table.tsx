"use client"

import Link from "next/link"
import { Users, Eye } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/client"
import { formatDate } from "@/lib/i18n/format"
import { COACH_SUBSCRIPTION_STATUS_BADGE_VARIANTS } from "@/lib/constants"
import type { getAdminTrainers } from "@/server/services/admin.service"
import type { CoachSubscriptionStatus } from "@/lib/db/enums"

export function AdminTrainersTable({
  trainers,
}: {
  trainers: Awaited<ReturnType<typeof getAdminTrainers>>["trainers"]
}) {
  const { t, locale } = useI18n()
  const c = t.admin.trainers.columns

  return (
    <>
      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {trainers.map((trainer) => (
          <div
            key={trainer.id}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{trainer.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  <span dir="ltr">{trainer.phone}</span>
                </p>
              </div>
              <div className="shrink-0 text-end text-xs text-muted-foreground">
                {trainer.user?.username ?? "—"}
              </div>
            </div>

            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between"><span>{trainer._count.clients} clients</span><Badge variant={trainer.accountStatus === "SUSPENDED" ? "destructive" : "default"}>{trainer.accountStatus ?? "ACTIVE"}</Badge></div>
              <div className="flex justify-between"><span>Subscription:</span><span>{trainer.subscriptionStatus ? <Badge variant={COACH_SUBSCRIPTION_STATUS_BADGE_VARIANTS[trainer.subscriptionStatus as CoachSubscriptionStatus] ?? "outline"}>{trainer.subscriptionStatus}</Badge> : "—"}</span></div>
              <div className="flex justify-between"><span>Expires:</span><span>{trainer.subscriptionEndDate ? formatDate(trainer.subscriptionEndDate as unknown as string, locale) : "—"}</span></div>
              <div className="flex justify-between"><span>Amount:</span><span>{trainer.amountPaid ? `${trainer.amountPaid} EGP` : "—"}</span></div>
              <div className="flex justify-between"><span>Branding:</span><span>{trainer.hasCustomBranding ? <Badge variant="secondary">Custom</Badge> : <Badge variant="outline">Default</Badge>}</span></div>
            </div>

            <div className="mt-3 pt-3 border-t flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={`/admin/trainers/${trainer.id}`}>
                  <Eye className="size-4" />
                  View
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={`/admin/clients?trainerId=${trainer.id}`}>
                  <Users className="size-4" />
                  {t.admin.trainers.viewClients}
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{c.fullName}</TableHead>
              <TableHead>{c.phone}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Branding</TableHead>
              <TableHead className="text-end">{c.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainers.map((trainer) => (
              <TableRow key={trainer.id}>
                <TableCell>
                  <Link href={`/admin/trainers/${trainer.id}`} className="font-medium hover:underline">
                    {trainer.fullName}
                  </Link>
                  <div className="text-xs text-muted-foreground">{trainer.user?.username ?? trainer.phone}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={trainer.accountStatus === "SUSPENDED" ? "destructive" : "default"}>
                    {trainer.accountStatus ?? "ACTIVE"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {trainer.subscriptionStatus ? <Badge variant={COACH_SUBSCRIPTION_STATUS_BADGE_VARIANTS[trainer.subscriptionStatus as CoachSubscriptionStatus] ?? "outline"}>{trainer.subscriptionStatus}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {trainer.subscriptionEndDate ? formatDate(trainer.subscriptionEndDate as unknown as string, locale) : "—"}
                </TableCell>
                <TableCell className="text-xs">
                  {trainer.amountPaid ? `${trainer.amountPaid} EGP` : "—"}
                </TableCell>
                <TableCell>
                  {trainer.hasCustomBranding ? <Badge variant="secondary">Custom</Badge> : <Badge variant="outline">Default</Badge>}
                </TableCell>
                <TableCell className="text-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/trainers/${trainer.id}`}>
                      <Eye className="size-4" />
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
