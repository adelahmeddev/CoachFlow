import type { Metadata } from "next"
import { getPublicClientByInviteToken } from "@/server/services/invite.service"
import { getBrandingForClient } from "@/server/services/branding.service"
import { BrandingProvider } from "@/components/branding/branding-provider"
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

  // Public page — brand it with the inviting coach's identity
  const inviteBranding = result.valid
    ? await getBrandingForClient(result.clientId)
    : null
  const branding = {
    brandName: inviteBranding?.brandName ?? "Coach Flow",
    logoUrl: inviteBranding?.logoUrl ?? null,
    primaryColor: inviteBranding?.primaryColor ?? "#961112",
    whatsappUrl: inviteBranding?.whatsappUrl ?? null,
    facebookUrl: inviteBranding?.facebookUrl ?? null,
    instagramUrl: inviteBranding?.instagramUrl ?? null,
    coachId: inviteBranding?.coachId ?? null,
  }

  return (
    <BrandingProvider branding={branding}>
      <InviteFormClient result={result} token={token} />
    </BrandingProvider>
  )
}