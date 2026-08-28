"use client"

import { TriangleAlert } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import {
  getExerciseName,
} from "@/lib/i18n/labels"
import type { ExerciseOption } from "@/lib/exercise-safety"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface ConflictResolution {
  dayIndex: number
  exerciseIndex: number
  exerciseId: string
  exerciseName: string
  reason: "neckPain" | "kneePain" | "backPain" | "shoulderPain"
  suggestion: ExerciseOption | null
}

interface SafetyWarningDialogProps {
  open: boolean
  conflicts: ConflictResolution[]
  onReplace: (conflict: ConflictResolution) => void
  onKeep: (conflict: ConflictResolution) => void
}

export function SafetyWarningDialog({
  open,
  conflicts,
  onReplace,
  onKeep,
}: SafetyWarningDialogProps) {
  const { t, locale } = useI18n()

  if (conflicts.length === 0) return null

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="size-5" />
            {t.trainingSplit.safetyTitle}
          </DialogTitle>
          <DialogDescription>
            {t.trainingSplit.safetyDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {conflicts.map((conflict, index) => (
            <div
              key={`${conflict.dayIndex}-${conflict.exerciseIndex}-${index}`}
              className="space-y-2 rounded-lg border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{conflict.exerciseName}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.trainingSplit.dayPrefix} {conflict.dayIndex + 1} ·{" "}
                    {conflict.reason === "neckPain"
                      ? ((t.trainingSplit as unknown as Record<string, string>).safetyNeck ?? "Neck pain")
                      : conflict.reason === "kneePain"
                        ? t.trainingSplit.safetyKnee
                        : conflict.reason === "backPain"
                          ? t.trainingSplit.safetyBack
                          : t.trainingSplit.safetyShoulder}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 text-sm text-muted-foreground">
                  {conflict.suggestion ? (
                    <>
                      <span className="me-1 font-medium text-foreground">
                        {t.trainingSplit.suggestedAlternative}:
                      </span>
                      {getExerciseName(conflict.suggestion, locale)}
                    </>
                  ) : (
                    t.trainingSplit.noAlternative
                  )}
                </p>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onKeep(conflict)}
                  >
                    {t.trainingSplit.keep}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!conflict.suggestion}
                    onClick={() => onReplace(conflict)}
                  >
                    {t.trainingSplit.replace}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
