"use client"

import { useState, useTransition } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateClientPainFlagsAction } from "@/server/actions/body-composition"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"

export function PainFlagsForm({
  clientId,
  initial,
}: {
  clientId: string
  initial: { neckPain: boolean; shoulderPain: boolean; backPain: boolean; kneePain: boolean }
}) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()
  const [flags, setFlags] = useState(initial)

  function toggle(key: keyof typeof flags) {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updateClientPainFlagsAction(clientId, flags)
      if (!res.ok) toast.error(t.toasts.genericError)
      else toast.success(t.toasts.updated)
    })
  }

  const changed =
    flags.neckPain !== initial.neckPain ||
    flags.shoulderPain !== initial.shoulderPain ||
    flags.backPain !== initial.backPain ||
    flags.kneePain !== initial.kneePain

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">الآلام | Pain Flags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { key: "neckPain" as const, label: "ألم الرقبة | Neck Pain" },
            { key: "shoulderPain" as const, label: "ألم الكتف | Shoulder Pain" },
            { key: "backPain" as const, label: "ألم الظهر | Back Pain" },
            { key: "kneePain" as const, label: "ألم الركبة | Knee Pain" },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-accent">
              <Checkbox checked={flags[item.key]} onCheckedChange={() => toggle(item.key)} />
              <span className="text-sm">{item.label}</span>
            </label>
          ))}
        </div>
        <Button onClick={handleSave} disabled={!changed || pending} size="sm">
          {pending ? t.common.saving : t.common.save}
        </Button>
      </CardContent>
    </Card>
  )
}
