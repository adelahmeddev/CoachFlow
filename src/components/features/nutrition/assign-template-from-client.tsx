"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"
import { assignTemplateAction } from "@/server/actions/nutrition"

export type TemplateSummary = {
  id: string
  name: string
  calories: number | null
  mealsCount: number
  isGlobal: boolean
}

export function AssignTemplateFromClient({
  clientId,
  templates,
}: {
  clientId: string
  templates: TemplateSummary[]
}) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()

  if (!templates || templates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          {t.nutrition.emptyDescription}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.nutrition.assignToClient}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.map((tpl) => (
          <div key={tpl.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium">{tpl.name}</p>
              <p className="text-xs text-muted-foreground">
                {tpl.calories ? `${tpl.calories} kcal` : "—"} · {tpl.mealsCount} meals
                {tpl.isGlobal && " · Global"}
              </p>
            </div>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await assignTemplateAction(tpl.id, [clientId])
                  if (result.ok) {
                    toast.success(t.nutrition.assignedToast.replace("{count}", "1"))
                  } else {
                    toast.error(t.toasts.genericError)
                  }
                })
              }
            >
              {t.nutrition.assign}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
