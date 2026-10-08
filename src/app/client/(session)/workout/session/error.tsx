"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Dumbbell, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"

export default function WorkoutSessionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const isAr = locale === "ar"

  useEffect(() => {
    console.error("Workout session error:", error)
  }, [error])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Dumbbell className="size-6" />
          </div>
          <CardTitle className="text-base font-bold text-foreground">
            {isAr ? "حدث خطأ غير متوقع أثناء تسجيل التمرين" : "Unexpected error during workout session"}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {isAr 
              ? "يمكنك إعادة المحاولة لاستئناف جلستك الحالية أو العودة لشاشة اليوم"
              : "You can retry to resume your current workout or return to today's summary"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={reset} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold gap-2 rounded-xl text-xs">
            <RefreshCw className="size-3.5" />
            <span>{isAr ? "إعادة المحاولة واستئناف التمرين" : "Retry & Resume Workout"}</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/client/workout/today")}
            className="w-full rounded-xl border-border text-xs font-semibold gap-2"
          >
            <ArrowLeft className="size-3.5" />
            <span>{isAr ? "العودة لتمرين اليوم" : "Back to Today's Workout"}</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
