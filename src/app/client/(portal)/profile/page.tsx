import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getClientProfile } from "@/server/services/client-portal.service"
import { pool } from "@/lib/db"
import { getAppUrl } from "@/lib/app-url"
import type { BodyComposition } from "@/lib/db/types"
import { MyInfoSection } from "@/components/features/client/profile/client-info-section"
import { MyGoalsSection } from "@/components/features/client/profile/client-goals-section"
import { MySubscriptionSection } from "@/components/features/client/profile/client-subscription-section"
import { MySettingsSection } from "@/components/features/client/profile/client-settings-section"
import { ClientQuickActions } from "@/components/features/client/profile/client-quick-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PainFlagsForm } from "@/components/features/body-composition/pain-flags-form"
import { BodyCompositionForm } from "@/components/features/body-composition/body-composition-form"
import { BodyCompositionHistory } from "@/components/features/body-composition/body-composition-history"
import { BodyCompositionComparison } from "@/components/features/body-composition/body-composition-comparison"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ClientProfilePage() {
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId

  if (!clientId) {
    redirect("/client/login")
  }

  const client = await getClientProfile(clientId)

  if (!client) {
    redirect("/client/login")
  }

  // BodyComposition is source of truth; client.goal is canonical
  const bodyCompositionsRes = await pool.query<BodyComposition>(`SELECT * FROM "BodyComposition" WHERE "clientId" = $1 ORDER BY "date" DESC`, [client.id])
  const bodyCompositions = bodyCompositionsRes.rows as BodyComposition[]

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <ClientQuickActions
        phone={client.phone ?? null}
        clientName={client.fullName ?? "Client"}
        portalUrl={`${getAppUrl()}/client/home`}
      />
      <Tabs defaultValue="info">
        <TabsList className="!h-auto flex-wrap">
          <TabsTrigger value="info">My Info</TabsTrigger>
          <TabsTrigger value="inbody">تكوين الجسم | InBody</TabsTrigger>
          <TabsTrigger value="goals">My Goals</TabsTrigger>
          <TabsTrigger value="subscription">My Subscription</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="space-y-6">
          <MyInfoSection
            client={{
              id: client.id,
              fullName: client.fullName ?? "Client",
              phone: client.phone ?? "",
              email: client.email ?? "",
              goal: client.goal ?? null,
            }}
          />
          <PainFlagsForm
            clientId={client.id}
            initial={{
              neckPain: (client as unknown as { neckPain?: boolean }).neckPain ?? false,
              shoulderPain: (client as unknown as { shoulderPain?: boolean }).shoulderPain ?? false,
              backPain: (client as unknown as { backPain?: boolean }).backPain ?? false,
              kneePain: (client as unknown as { kneePain?: boolean }).kneePain ?? false,
            }}
          />
        </TabsContent>
        <TabsContent value="inbody" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تكوين الجسم | InBody — إضافة تحليل</CardTitle>
              <CardDescription>Add new InBody entry — date required, other fields optional</CardDescription>
            </CardHeader>
            <CardContent>
              <BodyCompositionForm clientId={client.id} />
            </CardContent>
          </Card>
          {bodyCompositions.length >= 2 && <BodyCompositionComparison entries={bodyCompositions as never} />}
          <BodyCompositionHistory clientId={client.id} entries={bodyCompositions as never} canEdit={false} canDelete={false} />
        </TabsContent>
        <TabsContent value="goals">
          <MyGoalsSection
            client={{
              targetWeightKg: null,
              targetDate: null,
            }}
          />
        </TabsContent>
        <TabsContent value="subscription">
          <MySubscriptionSection client={client} />
        </TabsContent>
        <TabsContent value="settings">
          <MySettingsSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
