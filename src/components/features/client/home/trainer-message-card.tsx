"use client"

import { MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"

export function TrainerMessageCard({ notes }: { notes: string }) {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5 text-brand-600 dark:text-brand-400" />
          <CardTitle>{isAr ? "المدرب" : "Coach"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm break-words leading-relaxed text-muted-foreground">{notes}</p>
      </CardContent>
    </Card>
  )
}
