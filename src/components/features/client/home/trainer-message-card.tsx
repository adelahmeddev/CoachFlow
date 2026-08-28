"use client"

import { MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TrainerMessageCard({ notes }: { notes: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5 text-brand-600 dark:text-brand-400" />
          <CardTitle>المدرب</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{notes}</p>
      </CardContent>
    </Card>
  )
}
