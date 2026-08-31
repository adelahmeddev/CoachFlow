"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"
import { assignTemplateAction } from "@/server/actions/nutrition"

interface Template {
  id: string
  name: string
  calories: number
  mealsCount: number
  isGlobal: boolean
}

export function ChangePlanDialog({ clientId, templates }: { clientId: string; templates: Template[] }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">{t.nutrition.assignToClients}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.nutrition.assignToClients}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-auto">
          {templates.map((tpl) => (
            <div key={tpl.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">{tpl.name}</p>
                <p className="text-xs text-muted-foreground">{tpl.calories} kcal · {tpl.mealsCount} meals {tpl.isGlobal && "· Global"}</p>
              </div>
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await assignTemplateAction(tpl.id, [clientId])
                    if (result.ok) {
                      toast.success(t.nutrition.assignedToast.replace("{count}", "1"))
                      setOpen(false)
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
          {templates.length === 0 && <p className="text-sm text-muted-foreground">{t.nutrition.emptyDescription}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
