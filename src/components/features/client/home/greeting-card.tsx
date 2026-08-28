"use client"

import { useI18n } from "@/lib/i18n/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { lookup } from "@/lib/i18n/lookup"
import { Zap } from "lucide-react"

export function GreetingCard({
  client,
  streak = 0,
}: {
  client: { fullName: string }
  streak?: number
}) {
  const { t, locale } = useI18n()
  const date = new Date().toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline gap-2 flex-wrap">
          <CardTitle className="text-xl font-bold">
            {lookup(t, "client.home.greeting")}, {client.fullName}
          </CardTitle>
          {streak > 0 && (
            <span className="sticker inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-brand-700 dark:text-brand-300" style={{ color: "#BA470C" }}>
              <Zap className="size-3.5" />
              {streak}
            </span>
          )}
        </div>
        <CardDescription>{date}</CardDescription>
      </CardHeader>
    </Card>
  )
}