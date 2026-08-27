"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getI18n } from "@/lib/i18n"

interface Template {
  id: string
  name: string
  calories: number
  mealsCount: number
  isGlobal: boolean
}

export function ChangePlanDialog({ clientId, templates }: { clientId: string; templates: Template[] }) {
  const [open, setOpen] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const assign = async (templateId: string) => {
    setLoadingId(templateId)
    try {
      const res = await fetch(`/api/clients/${clientId}/nutrition/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      })
      if (!res.ok) throw new Error("Failed")
      setOpen(false)
      window.location.reload()
    } catch (e) {
      alert("Failed to assign plan")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Change Plan</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Change Nutrition Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-auto">
          {templates.map(t => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.calories} kcal • {t.mealsCount} meals {t.isGlobal && "• Global"}</p>
              </div>
              <Button size="sm" disabled={!!loadingId} onClick={() => assign(t.id)}>
                {loadingId === t.id ? "Assigning..." : "Assign"}
              </Button>
            </div>
          ))}
          {templates.length === 0 && <p className="text-sm text-muted-foreground">No templates available</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
