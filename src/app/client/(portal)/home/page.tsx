import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getClientHomeData } from "@/server/services/client-portal.service"
import { getCheckinStatus } from "@/server/services/checkin.service"
import { listPublishedPostsForClient } from "@/server/services/blog.service"
import { ClientHomeUI } from "./ClientHomeUI"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientHomePage() {
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId

  if (!clientId) {
    redirect("/client/login")
  }

  const [data, checkin, blog] = await Promise.all([
    getClientHomeData(clientId),
    getCheckinStatus(clientId),
    listPublishedPostsForClient(clientId, 6),
  ])

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
      data={{
        ...data,
        // Real check-in streak (was a 0/1 stub in getClientHomeData).
        client: { ...data.client, streak: checkin.current },
      }}
      checkin={checkin}
      posts={blog.posts}
    />
  )
}