"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import type { GoalType } from "@/lib/db/enums"
import type { GoalWithProgress } from "@/server/services/goal.service"
import { createGoalAction, updateGoalAction } from "@/server/actions/goals"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function toDateInput(v: Date | string | null): string {
  if (!v) return ""
  return new Date(v).toISOString().slice(0, 10)
}

export function GoalFormDialog({
  clientId,
  goal,
  trigger,
}: {
  clientId: string
  goal?: GoalWithProgress
  trigger?: React.ReactNode
}) {
  const { t } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const types = lookup(t, "goals.types") as unknown as Record<string, string>
  const goalTypes: GoalType[] = ["WEIGHT", "BODY_FAT", "MUSCLE", "MEASUREMENT", "STRENGTH", "CUSTOM"]

  async function onSubmit(formData: FormData) {
    const input = {
      type: formData.get("type"),
      title: formData.get("title"),
      startValue: formData.get("startValue") || null,
      currentValue: formData.get("currentValue") || null,
      targetValue: formData.get("targetValue"),
      unit: formData.get("unit") || null,
      deadline: formData.get("deadline") || null,
    }
    startTransition(async () => {
      const result = goal
        ? await updateGoalAction(goal.id, clientId, input)
        : await createGoalAction(clientId, input)
      if (result.ok) {
        toast.success(goal ? t.goals.updated : t.goals.created)
        setOpen(false)
        router.refresh()
      } else if (result.error === "INVALID_INPUT") {
        toast.error(t.toasts.error)
      } else {
        toast.error(t.toasts.error)
      }
    })
  }

  const inputCls =
    "flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
  const labelCls = "text-xs font-semibold"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ??
          (goal ? (
            <Button variant="ghost" size="sm" className="gap-1">
              <Pencil className="size-3.5" />
              {t.common.edit}
            </Button>
          ) : (
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              {t.goals.newGoal}
            </Button>
          ))}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal ? t.goals.editGoal : t.goals.newGoal}</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelCls}>{t.goals.type}</label>
              <select name="type" defaultValue={goal?.type ?? "WEIGHT"} className={inputCls}>
                {goalTypes.map((gt) => (
                  <option key={gt} value={gt}>
                    {types[gt.toLowerCase()] ?? gt}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>{t.goals.goalTitle}</label>
              <input
                name="title"
                defaultValue={goal?.title ?? ""}
                required
                minLength={2}
                maxLength={100}
                placeholder={t.goals.titlePlaceholder}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>{t.goals.startValue}</label>
              <input
                name="startValue"
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                defaultValue={goal?.startValue ?? ""}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>{t.goals.currentValue}</label>
              <input
                name="currentValue"
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                defaultValue={goal?.currentValue ?? ""}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>{t.goals.targetValue}</label>
              <input
                name="targetValue"
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                required
                defaultValue={goal?.targetValue ?? ""}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>{t.goals.unit}</label>
              <input
                name="unit"
                defaultValue={goal?.unit ?? ""}
                maxLength={12}
                placeholder={t.goals.unitPlaceholder}
                className={inputCls}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{t.goals.deadline}</label>
            <input
              name="deadline"
              type="date"
              defaultValue={toDateInput(goal?.deadline ?? null)}
              className={inputCls}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin me-2" /> : null}
              {goal ? t.common.save : t.goals.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
