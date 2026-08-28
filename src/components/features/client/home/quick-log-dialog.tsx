"use client"

import { useState } from "react"
import { saveDailyLogAction } from "@/server/actions/client-portal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"

export function QuickLogDialog({ clientId }: { clientId: string }) {
  const { t } = useI18n()
  const [weight, setWeight] = useState("")
  const [sleepHours, setSleepHours] = useState("")
  const [waterLiters, setWaterLiters] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveDailyLogAction(clientId, {
        weightKg: weight ? Number(weight) : undefined,
        sleepHours: sleepHours ? Number(sleepHours) : undefined,
        waterLiters: waterLiters ? Number(waterLiters) : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            {lookup(t, "client.common.loading")}
          </label>
          <Input
            type="number"
            placeholder="Weight (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              {lookup(t, "client.common.hours")}
            </label>
            <Select value={sleepHours} onValueChange={setSleepHours}>
              <SelectTrigger>
                <SelectValue placeholder="Sleep (h)" />
              </SelectTrigger>
              <SelectContent>
                {[4, 5, 6, 7, 8, 9, 10].map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {h} h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              {lookup(t, "client.common.liters")}
            </label>
            <Select value={waterLiters} onValueChange={setWaterLiters}>
              <SelectTrigger>
                <SelectValue placeholder="Water (L)" />
              </SelectTrigger>
              <SelectContent>
                {[0.5, 1, 1.5, 2, 2.5, 3].map((l) => (
                  <SelectItem key={l} value={String(l)}>
                    {l} L
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? lookup(t, "client.common.loading") : lookup(t, "client.common.save")}
        </Button>
      </CardContent>
    </Card>
  )
}
