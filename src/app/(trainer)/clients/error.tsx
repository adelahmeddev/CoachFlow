"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"

export default function TrainerRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const { t } = useI18n()

  useEffect(() => {
    console.error("Trainer route error:", error)
  }, [error])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-destructive">{t.common.error}</CardTitle>
          <CardDescription>{t.toasts.genericError}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="size-4" />
            {t.common.retry}
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <Home className="size-4 me-2" />
            {t.nav.dashboard}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
