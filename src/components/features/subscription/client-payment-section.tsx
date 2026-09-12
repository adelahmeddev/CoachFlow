import { getCurrentSession } from "@/server/auth"
import { getClientProfile } from "@/server/services/client-portal.service"
import { listProofsForClient } from "@/server/services/payment-proof.service"
import { getI18n } from "@/lib/i18n"
import { PaymentProofForm } from "./payment-proof-form"

export async function ClientPaymentSection() {
  const { locale } = await getI18n()
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId
  if (!clientId) return null

  const [client, proofs] = await Promise.all([
    getClientProfile(clientId),
    listProofsForClient(clientId, 20),
  ])
  if (!client) return null

  const subscriptions = ((client as unknown as { subscriptions?: Array<{ id: string; planName: string }> }).subscriptions ?? []).map(
    (s) => ({ id: s.id, planName: s.planName })
  )

  return <PaymentProofForm subscriptions={subscriptions} proofs={proofs} locale={locale} />
}
