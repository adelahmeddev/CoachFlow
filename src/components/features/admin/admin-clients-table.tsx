"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useI18n } from "@/lib/i18n/client"
import { formatDate } from "@/lib/i18n/format"
import {
  getClientStatusLabel,
  getGoalLabel,
  getSubscriptionStatusLabel,
} from "@/lib/i18n/labels"
import {
  CLIENT_STATUS_BADGE_VARIANTS,
  SUBSCRIPTION_STATUS_BADGE_VARIANTS,
} from "@/lib/constants"
import { differenceInYears } from "date-fns"
import type { getAdminClients } from "@/server/services/admin.service"
import { ResetPasswordDialog } from "@/components/features/clients/reset-password-dialog"

function getInitials(fullName: string | null) {
  if (!fullName) return "?"
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

export function AdminClientsTable({
  clients,
}: {
  clients: Awaited<ReturnType<typeof getAdminClients>>["clients"]
}) {
  const { t, locale } = useI18n()
  const c = t.admin.clients.columns

  if (clients.length === 0) {
    return <div className="py-10" />
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {clients.map((client) => (
          <div
            key={client.id}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {getInitials(client.fullName)}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/clients/${client.id}`}
                  className="block truncate font-medium hover:underline"
                >
                  {client.fullName ?? t.admin.clients.invitedClient}
                </Link>
                {client.phone && (
                  <p className="truncate text-xs text-muted-foreground">
                    <span dir="ltr">{client.phone}</span>
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {client.birthDate
                  ? differenceInYears(new Date(), client.birthDate)
                  : "—"}
              </span>
            </div>

            <div className="mb-3 flex flex-wrap gap-1">
              <Badge variant={CLIENT_STATUS_BADGE_VARIANTS[client.status]}>
                {getClientStatusLabel(client.status, locale)}
              </Badge>
              {client.goal && (
                <Badge variant="outline">
                  {getGoalLabel(client.goal, locale)}
                </Badge>
              )}
              {client.subscription ? (
                <Badge
                  variant={
                    SUBSCRIPTION_STATUS_BADGE_VARIANTS[
                      client.subscription.status
                    ]
                  }
                >
                  {client.subscription.planName}
                </Badge>
              ) : (
                <Badge variant="secondary">
                  {t.admin.clients.noSubscription}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {client.trainer?.fullName ?? "—"}
              </span>
              <span>{formatDate(client.createdAt, locale)}</span>
            </div>

            <div className="mt-3 pt-3 border-t">
              <ResetPasswordDialog
                clientId={client.id}
                clientName={client.fullName ?? ""}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{c.client}</TableHead>
              <TableHead>{c.age}</TableHead>
              <TableHead>{c.trainer}</TableHead>
              <TableHead>{c.goal}</TableHead>
              <TableHead>{c.status}</TableHead>
              <TableHead>{c.subscription}</TableHead>
              <TableHead>{c.createdAt}</TableHead>
              <TableHead>{c.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {getInitials(client.fullName)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {client.fullName ?? t.admin.clients.invitedClient}
                      </p>
                      {client.phone && (
                        <p className="truncate text-xs text-muted-foreground">
                          <span dir="ltr">{client.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.birthDate
                    ? differenceInYears(new Date(), client.birthDate)
                    : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.trainer?.fullName ?? "—"}
                </TableCell>
                <TableCell>
                  {client.goal ? (
                    <span className="text-sm">
                      {getGoalLabel(client.goal, locale)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={CLIENT_STATUS_BADGE_VARIANTS[client.status]}>
                    {getClientStatusLabel(client.status, locale)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {client.subscription ? (
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-medium">
                        {client.subscription.planName}
                      </span>
                      <Badge
                        variant={
                          SUBSCRIPTION_STATUS_BADGE_VARIANTS[
                            client.subscription.status
                          ]
                        }
                      >
                        {getSubscriptionStatusLabel(
                          client.subscription.status,
                          locale
                        )}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t.admin.clients.noSubscription}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(client.createdAt, locale)}
                </TableCell>
                <TableCell>
                  <ResetPasswordDialog
                    clientId={client.id}
                    clientName={client.fullName ?? ""}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
