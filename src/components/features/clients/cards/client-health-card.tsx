import { Stethoscope, AlertTriangle } from "lucide-react"
import { getI18n } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ClientHealthCardProps {
  injuries: string | null
  healthConditions: string | null
  medications: string | null
}

export async function ClientHealthCard({
  injuries,
  healthConditions,
  medications,
}: ClientHealthCardProps) {
  const { t } = await getI18n()
  const hasHealthData = !!(injuries || healthConditions || medications)

  if (!hasHealthData) {
    return (
      <Card>
        <CardHeader className="flex flex-row justify-between items-center pb-2 border-b">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Stethoscope className="size-4" />
            {t.profile.healthCard.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col items-center justify-center min-h-[120px] text-muted-foreground/60">
          <Stethoscope className="size-8 mb-2 opacity-20" />
          <p className="text-sm">{t.profile.healthCard.noneReported}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-destructive/30 bg-destructive/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-destructive/60" />
      <CardHeader className="flex flex-row justify-between items-center pb-3 border-b border-destructive/10">
        <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
          <AlertTriangle className="size-4" />
          {t.profile.healthCard.healthAlert}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {injuries && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t.profile.healthCard.injuries}
            </div>
            <p className="text-sm font-medium leading-relaxed bg-destructive/10 text-destructive-foreground px-2.5 py-1.5 rounded-md">
              {injuries}
            </p>
          </div>
        )}
        
        {healthConditions && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t.profile.healthCard.healthConditions}
            </div>
            <p className="text-sm font-medium leading-relaxed bg-destructive/10 text-destructive-foreground px-2.5 py-1.5 rounded-md">
              {healthConditions}
            </p>
          </div>
        )}

        {medications && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t.profile.healthCard.medications}
            </div>
            <p className="text-sm font-medium leading-relaxed bg-destructive/10 text-destructive-foreground px-2.5 py-1.5 rounded-md">
              {medications}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
