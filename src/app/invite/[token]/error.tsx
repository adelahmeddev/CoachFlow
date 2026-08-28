"use client"

import { useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"

export default function InviteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useI18n()

  useEffect(() => {
    console.error("Invite error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-destructive">{t.common.error}</CardTitle>
          <CardDescription>{t.invite.invalidDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset} className="w-full gap-2">
            <RefreshCw className="size-4" />
            {t.common.retry}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}