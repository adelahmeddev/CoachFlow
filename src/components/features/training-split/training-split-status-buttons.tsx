"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateTrainingSplitStatusAction } from "@/server/actions/training-split"
import { PlanStatus } from "@/lib/db/enums"

interface TrainingSplitStatusButtonsProps {
  clientId: string
  splitId: string
  currentStatus: PlanStatus
  className?: string
}

export function TrainingSplitStatusButtons({
  clientId,
  splitId,
  currentStatus,
  className,
}: TrainingSplitStatusButtonsProps) {
  const [pendingStatus, setPendingStatus] = useState<PlanStatus | null>(null)

  async function handleStatusChange(status: PlanStatus) {
    setPendingStatus(status)
    try {
      const result = await updateTrainingSplitStatusAction(
        clientId,
        splitId,
        status
      )
      if (!result.ok) {
        toast.error(result.error ?? "Failed to update status")
        return
      }
      toast.success(status === PlanStatus.PAUSED ? "Split paused" : "Split completed")
    } catch (e) {
      const err = e as { digest?: string }
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw e
      }
      toast.error("Something went wrong. Please try again.")
    } finally {
      setPendingStatus(null)
    }
  }

  if (currentStatus !== PlanStatus.ACTIVE) {
    return null
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleStatusChange(PlanStatus.PAUSED)}
        disabled={pendingStatus !== null}
      >
        {pendingStatus === PlanStatus.PAUSED && (
          <Loader2 className="me-2 h-4 w-4 animate-spin" />
        )}
        Pause
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleStatusChange(PlanStatus.COMPLETED)}
        disabled={pendingStatus !== null}
      >
        {pendingStatus === PlanStatus.COMPLETED && (
          <Loader2 className="me-2 h-4 w-4 animate-spin" />
        )}
        Complete
      </Button>
    </div>
  )
}
