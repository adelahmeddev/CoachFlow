import { getI18n } from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/format"
import { getInviteState } from "@/lib/invite-status"
import type { ClientProfile } from "@/server/services/client-profile.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CopyInviteButton,
  CreateLoginDialog,
  ExtendInviteButton,
  InviteStatusBadge,
  ResendInviteButton,
} from "./client-access-actions"

export async function ClientAccessCard({
  clientId,
  profile,
}: {
  clientId: string
  profile: ClientProfile
}) {
  const { t, locale } = await getI18n()
  const client = profile.client
  // "now" defaults inside getInviteState (evaluated outside render purity rules).
  const invite = getInviteState({
    userId: client.userId,
    inviteToken: client.inviteToken,
    inviteExpiresAt: client.inviteExpiresAt,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.clients.createLogin}</CardTitle>
        <CardDescription>
          {client.phone ?? t.profile.overview.noPhone} •{" "}
          {client.basicInfoCompletedAt
            ? formatDate(client.basicInfoCompletedAt, locale)
            : t.profile.overview.no}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{t.onboarding.inviteList.status}</span>
          <InviteStatusBadge state={invite.state} daysLeft={invite.daysLeft} />
        </div>

        {invite.state === "accepted" ? (
          <p className="text-sm text-muted-foreground">{t.clients.alreadyAccepted}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {client.inviteToken ? (
              <>
                <CopyInviteButton token={client.inviteToken} />
                <ResendInviteButton clientId={clientId} />
                <ExtendInviteButton clientId={clientId} />
              </>
            ) : null}
            <CreateLoginDialog
              clientId={clientId}
              clientName={client.fullName ?? t.profile.overview.invitedClient}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
