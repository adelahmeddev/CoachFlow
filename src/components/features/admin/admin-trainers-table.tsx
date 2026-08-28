"use client"

import Link from "next/link"
import { Users } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/client"
import { formatDate } from "@/lib/i18n/format"
import type { getAdminTrainers } from "@/server/services/admin.service"

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

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{trainer._count.clients} clients</span>
              <span>{formatDate(trainer.createdAt, locale)}</span>
            </div>

            <div className="mt-3 pt-3 border-t">
              <Button asChild variant="outline" size="sm" className="w-full">
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
              <TableHead>{c.username}</TableHead>
              <TableHead>{c.clientsCount}</TableHead>
              <TableHead>{c.createdAt}</TableHead>
              <TableHead className="text-end">{c.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainers.map((trainer) => (
              <TableRow key={trainer.id}>
                <TableCell>
                  <span className="font-medium">{trainer.fullName}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span dir="ltr">{trainer.phone}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {trainer.user?.username ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {trainer._count.clients}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(trainer.createdAt, locale)}
                </TableCell>
                <TableCell className="text-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/clients?trainerId=${trainer.id}`}>
                      <Users className="size-4" />
                      {t.admin.trainers.viewClients}
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
