"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Archive, Check, Loader2, Pause, Play } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"
import type { GoalStatus } from "@/lib/db/enums"
import type { GoalWithProgress } from "@/server/services/goal.service"
import { setGoalStatusAction } from "@/server/actions/goals"
import { Button } from "@/components/ui/button"

export function GoalStatusButtons({ goal, clientId }: { goal: GoalWithProgress; clientId: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function setStatus(status: GoalStatus) {
    startTransition(async () => {
      const result = await setGoalStatusAction(goal.id, clientId, { status })
      if (result.ok) {
        toast.success(t.goals.updated)
        router.refresh()
      } else {
        toast.error(t.toasts.error)
      }
    })
  }

  const btn = "h-7 gap-1 text-xs"

  return (
    <div className="flex flex-wrap gap-1.5">
      {goal.status === "ACTIVE" ? (
        <>
          <Button variant="outline" size="sm" className={btn} disabled={pending} onClick={() => setStatus("ACHIEVED")}>
            {pending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
            {t.goals.markAchieved}
          </Button>
          <Button variant="outline" size="sm" className={btn} disabled={pending} onClick={() => setStatus("PAUSED")}>
            <Pause className="size-3" />
            {t.goals.pause}
          </Button>
          <Button variant="ghost" size="sm" className={btn} disabled={pending} onClick={() => setStatus("CANCELLED")}>
            <Archive className="size-3" />
            {t.goals.archive}
          </Button>
        </>
      ) : (
        <Button variant="outline" size="sm" className={btn} disabled={pending} onClick={() => setStatus("ACTIVE")}>
          <Play className="size-3" />
          {t.goals.resume}
        </Button>
      )}
    </div>
  )
}
