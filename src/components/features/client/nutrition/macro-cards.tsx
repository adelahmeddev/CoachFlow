"use client"

import { Apple, Beef, Wheat, Droplet } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MacroCards({
  macros,
}: {
  macros: {
    calories: number
    protein: number
    carbs: number
    fats: number
    water: number
  }
}) {
  const { t } = useI18n()

  const items = [
    { label: lookup(t, "client.nutrition.calories"), value: `${macros.calories} kcal`, icon: Apple },
    { label: lookup(t, "client.nutrition.protein"), value: `${macros.protein}g`, icon: Beef },
    { label: lookup(t, "client.nutrition.carbs"), value: `${macros.carbs}g`, icon: Wheat },
    { label: lookup(t, "client.nutrition.fats"), value: `${macros.fats}g`, icon: Droplet },
    { label: lookup(t, "client.nutrition.water"), value: `${macros.water}L`, icon: Droplet },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{lookup(t, "client.nutrition.macros")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center"
            >
              <item.icon className="size-5 text-brand-600 dark:text-brand-400" />
              <span className="text-sm font-semibold">{item.value}</span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
