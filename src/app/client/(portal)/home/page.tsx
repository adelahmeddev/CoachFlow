import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getClientHomeData } from "@/server/services/client-portal.service"
import { ClientHomeUI } from "./ClientHomeUI"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientHomePage() {
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId

  if (!clientId) {
    redirect("/client/login")
  }

  const data = await getClientHomeData(clientId)

  if (!data) {
    redirect("/client/login")
  }

  const client = {
    id: data.client.id,
    fullName: data.client.fullName ?? "Client",
  }

  return (
    <ClientHomeUI
      client={client}
      data={data}
    />
  )
}