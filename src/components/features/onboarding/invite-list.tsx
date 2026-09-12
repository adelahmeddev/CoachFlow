"use client"

import { CheckCircle2, CircleDotDashed } from "lucide-react"
import type { getTrainerInvites } from "@/server/services/invite.service"
import { useI18n } from "@/lib/i18n/client"
import { getClientStatusLabel } from "@/lib/i18n/labels"
import { formatDate } from "@/lib/i18n/format"
import {
  CLIENT_STATUS_BADGE_VARIANTS,
} from "@/lib/constants"
import { getInviteState } from "@/lib/invite-status"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CopyInviteButton,
  ExtendInviteButton,
  InviteStatusBadge,
  ResendInviteButton,
} from "@/components/features/clients/client-access-actions"

type Invite = Awaited<ReturnType<typeof getTrainerInvites>>[number]

export function InviteList({ invites }: { invites: Invite[] }) {
  const { t, locale } = useI18n()

  if (invites.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm font-medium">{t.onboarding.inviteList.noInvites}</p>
          <p className="text-sm text-muted-foreground">
            {t.onboarding.inviteList.noInvitesDescription}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {t.onboarding.inviteList.title}
        </CardTitle>
        <CardDescription>{t.onboarding.inviteList.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.onboarding.inviteList.client}</TableHead>
              <TableHead>{t.onboarding.inviteList.status}</TableHead>
              <TableHead>{t.onboarding.inviteList.basicInfo}</TableHead>
              <TableHead>{t.onboarding.inviteList.expires}</TableHead>
              <TableHead>{t.onboarding.inviteList.inviteLink}</TableHead>
              <TableHead>{t.onboarding.inviteList.created}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => {
              // "now" defaults inside getInviteState (day-granular display).
              const state = getInviteState({
                userId: invite.userId,
                inviteToken: invite.inviteToken,
                inviteExpiresAt: invite.inviteExpiresAt,
              })
              return (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium">
                    {invite.fullName ?? t.onboarding.inviteList.invitedClient}
                  </TableCell>
                  <TableCell>
                    <Badge variant={CLIENT_STATUS_BADGE_VARIANTS[invite.status]}>
                      {getClientStatusLabel(invite.status, locale)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invite.basicInfoCompletedAt ? (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        {t.onboarding.inviteList.completed}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <CircleDotDashed className="size-4" />
                        {t.onboarding.inviteList.pending}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <InviteStatusBadge state={state.state} daysLeft={state.daysLeft} />
                    {invite.inviteExpiresAt && state.state === "pending" ? (
                      <span className="ms-2 text-xs text-muted-foreground tabular-nums">
                        {formatDate(invite.inviteExpiresAt, locale)}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {invite.inviteToken && !invite.userId ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <CopyInviteButton token={invite.inviteToken} />
                        <ResendInviteButton clientId={invite.id} />
                        <ExtendInviteButton clientId={invite.id} />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t.onboarding.inviteList.accepted}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatDate(invite.createdAt, locale)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
