"use client"

import { useState } from "react"
import { GitCompare, Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getPlanFullAction } from "@/server/actions/nutrition"
import { PlanCompareView } from "@/components/features/nutrition/plan-compare-view"
import type { ClientNutritionPlanFull } from "@/server/services/nutrition.service"

interface ComparePlanDialogProps {
  pastPlanId: string
  pastPlanName: string
  currentPlan: ClientNutritionPlanFull
}

export function ComparePlanDialog({
  pastPlanId,
  pastPlanName,
  currentPlan,
}: ComparePlanDialogProps) {
  const { t } = useI18n()
  const v = t.nutritionVersions
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pastPlan, setPastPlan] = useState<ClientNutritionPlanFull | null>(null)

  async function handleOpen() {
    setOpen(true)
    if (!pastPlan) {
      setLoading(true)
      try {
        const full = await getPlanFullAction(pastPlanId)
        setPastPlan(full)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 rounded-full px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        onClick={handleOpen}
      >
        <GitCompare className="size-3.5" />
        <span>{v.compareWithCurrent}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <GitCompare className="size-5 text-brand-500" />
              <span>{v.planCompareTitle}</span>
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-brand-500" />
            </div>
          ) : pastPlan ? (
            <div className="mt-4">
              <PlanCompareView prevPlan={pastPlan} currPlan={currentPlan} />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {v.noChanges}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
