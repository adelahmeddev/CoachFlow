import { pool } from "@/lib/db"
import { getCurrentSession } from "@/server/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getI18n } from "@/lib/i18n"
import { BodyCompositionForm } from "@/components/features/body-composition/body-composition-form"
import { BodyCompositionHistory } from "@/components/features/body-composition/body-composition-history"
import { BodyCompositionComparison } from "@/components/features/body-composition/body-composition-comparison"
import type { BodyComposition } from "@/lib/db/types"

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
  let clientRes
  if (trainerProfileId) {
    clientRes = await pool.query(`SELECT "id" FROM "Client" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`, [clientId, trainerProfileId])
  } else {
    clientRes = await pool.query(`SELECT "id" FROM "Client" WHERE "id" = $1 LIMIT 1`, [clientId])
  }
  const client = clientRes.rows[0] as { id: string } | undefined
  if (!client) return <p className="text-destructive text-sm">{t.toasts.unauthorized}</p>

  const bodyCompositionsRes = await pool.query<BodyComposition>(`SELECT * FROM "BodyComposition" WHERE "clientId" = $1 ORDER BY "date" DESC`, [client.id])
  const bodyCompositions = bodyCompositionsRes.rows as BodyComposition[]

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
