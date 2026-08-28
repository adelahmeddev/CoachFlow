"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  workoutLogSchema,
  type WorkoutLogInput,
} from "@/lib/validations/progress"
import { createWorkoutLogAction } from "@/server/actions/progress"

interface WorkoutLogFormDialogProps {
  clientId: string
}

function todayInput(): string {
  return new Date().toISOString().split("T")[0]
}

type ActionResult = {
  ok: boolean
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
}

function setFieldErrors(
  form: ReturnType<typeof useForm<WorkoutLogInput>>,
  result: ActionResult
) {
  if (!result.fieldErrors) return
  ;(Object.keys(result.fieldErrors) as (keyof WorkoutLogInput)[]).forEach(
    (field) => {
      const errors = result.fieldErrors?.[field]
      if (errors && errors.length > 0) {
        form.setError(field, { type: "server", message: errors[0] })
      }
    }
  )
}

export function WorkoutLogFormDialog({ clientId }: WorkoutLogFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<WorkoutLogInput>({
    resolver: zodResolver(workoutLogSchema),
    defaultValues: {
      date: todayInput(),
      exerciseName: "",
      sets: "",
      reps: "",
      weightKg: "",
      rpe: "",
      notes: "",
    },
  })

  async function onSubmit(values: WorkoutLogInput) {
    setIsSubmitting(true)

    const payload = {
      date: values.date,
      exerciseName: values.exerciseName,
      sets: values.sets === "" ? "" : Number(values.sets),
      reps: values.reps === "" ? "" : Number(values.reps),
      weightKg: values.weightKg === "" ? "" : Number(values.weightKg),
      rpe: values.rpe === "" ? "" : Number(values.rpe),
      notes: values.notes,
    }

    const result = await createWorkoutLogAction(clientId, payload)

    if (!result.ok) {
      setFieldErrors(form, result)
      toast.error(result.error ?? "Something went wrong")
      return
    }

    toast.success("Workout log added")
    setOpen(false)
    form.reset({
      date: todayInput(),
      exerciseName: "",
      sets: "",
      reps: "",
      weightKg: "",
      rpe: "",
      notes: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Add Workout Log
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Workout Log</DialogTitle>
          <DialogDescription>
            Log a training session or exercise for this client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...form.register("date")} />
            {form.formState.errors.date && (
              <p className="text-sm text-destructive">
                {form.formState.errors.date.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="exerciseName">Exercise Name</Label>
            <Input
              id="exerciseName"
              placeholder="e.g. Barbell Bench Press"
              {...form.register("exerciseName")}
            />
            {form.formState.errors.exerciseName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.exerciseName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                type="number"
                min={1}
                placeholder="3"
                {...form.register("sets", {
                  setValueAs: (v) => (v === "" || v === undefined ? "" : Number(v)),
                })}
              />
              {form.formState.errors.sets && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.sets.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                type="number"
                min={1}
                placeholder="10"
                {...form.register("reps", {
                  setValueAs: (v) => (v === "" || v === undefined ? "" : Number(v)),
                })}
              />
              {form.formState.errors.reps && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.reps.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weightKg">Weight (kg)</Label>
              <Input
                id="weightKg"
                type="number"
                step="0.5"
                min={0}
                placeholder="60"
                {...form.register("weightKg", {
                  setValueAs: (v) => (v === "" || v === undefined ? "" : Number(v)),
                })}
              />
              {form.formState.errors.weightKg && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.weightKg.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rpe">RPE (1-10)</Label>
              <Input
                id="rpe"
                type="number"
                min={1}
                max={10}
                placeholder="8"
                {...form.register("rpe", {
                  setValueAs: (v) => (v === "" || v === undefined ? "" : Number(v)),
                })}
              />
              {form.formState.errors.rpe && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.rpe.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Optional notes..."
              {...form.register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add Log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
