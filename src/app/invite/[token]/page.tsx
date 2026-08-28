import type { Metadata } from "next"
import { getPublicClientByInviteToken } from "@/server/services/invite.service"
import { getI18n } from "@/lib/i18n"
import { InviteFormClient } from "./invite-form-client"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return {
    title: t.invite.title,
  }
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const result = await getPublicClientByInviteToken(token)

  return <InviteFormClient result={result} token={token} />
}