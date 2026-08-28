import { prisma } from "@/lib/prisma"
import { getCurrentSession } from "@/server/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getI18n } from "@/lib/i18n"
import { BodyCompositionForm } from "@/components/features/body-composition/body-composition-form"
import { BodyCompositionHistory } from "@/components/features/body-composition/body-composition-history"
import { BodyCompositionComparison } from "@/components/features/body-composition/body-composition-comparison"

interface BodyCompositionTabProps {
  clientId: string
}

export async function BodyCompositionTab({ clientId }: BodyCompositionTabProps) {
  const { t } = await getI18n()
  const session = await getCurrentSession()
  if (!session?.user || (session.user.role !== "TRAINER" && session.user.role !== "ADMIN")) {
    return <p className="text-destructive text-sm">{t.toasts.unauthorized}</p>
  }

  const isAdmin = session.user.role === "ADMIN"
  const trainerProfileId = isAdmin ? undefined : session.user.trainerProfileId
  const where = trainerProfileId ? { id: clientId, trainerId: trainerProfileId } : { id: clientId }
  const client = await prisma.client.findFirst({ where, select: { id: true } })
  if (!client) return <p className="text-destructive text-sm">{t.toasts.unauthorized}</p>

  const bodyCompositions = await prisma.bodyComposition.findMany({
    where: { clientId: client.id },
    orderBy: { date: "desc" },
  })

  const canEdit = !isAdmin
  const canDelete = !isAdmin

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>تكوين الجسم | InBody — إضافة تحليل</CardTitle>
            <CardDescription>Body composition tracking — add new InBody entry</CardDescription>
          </CardHeader>
          <CardContent>
            <BodyCompositionForm clientId={clientId} />
          </CardContent>
        </Card>
      )}

      {bodyCompositions.length >= 2 && <BodyCompositionComparison entries={bodyCompositions as never} />}

      <Card>
        <CardHeader>
          <CardTitle>InBody History — السجل</CardTitle>
          <CardDescription>آخر تحاليل InBody — sorted by date</CardDescription>
        </CardHeader>
        <CardContent>
          <BodyCompositionHistory clientId={clientId} entries={bodyCompositions as never} canEdit={canEdit} canDelete={canDelete} />
        </CardContent>
      </Card>

      {isAdmin && bodyCompositions.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">No InBody records yet.</p>
      )}
    </div>
  )
}
