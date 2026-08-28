"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CheckCircle2, CircleDotDashed, Copy } from "lucide-react"
import { toast } from "sonner"
import { getInviteUrl } from "@/lib/app-url"
import type { getTrainerInvites } from "@/server/services/invite.service"
import { useI18n } from "@/lib/i18n/client"
import { getClientStatusLabel } from "@/lib/i18n/labels"
import {
  CLIENT_STATUS_BADGE_VARIANTS,
} from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

type Invite = Awaited<ReturnType<typeof getTrainerInvites>>[number]

function CopyLinkButton({ invite }: { invite: Invite }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  if (!invite.inviteToken) return null

  async function handleCopy() {
    await navigator.clipboard.writeText(getInviteUrl(invite.inviteToken!))
    setCopied(true)
    toast.success(t.onboarding.inviteList.linkCopied)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="gap-1"
    >
      {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? t.onboarding.inviteList.completed : t.common.copy}
    </Button>
  )
}

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
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.onboarding.inviteList.client}</TableHead>
              <TableHead>{t.onboarding.inviteList.status}</TableHead>
              <TableHead>{t.onboarding.inviteList.basicInfo}</TableHead>
              <TableHead>{t.onboarding.inviteList.inviteLink}</TableHead>
              <TableHead>{t.onboarding.inviteList.created}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => (
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
                <TableCell>
                  <CopyLinkButton invite={invite} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(invite.createdAt, "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
