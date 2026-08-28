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
  progressReviewSchema,
  type ProgressReviewInput,
} from "@/lib/validations/progress"
import { createProgressReviewAction } from "@/server/actions/progress"

interface ProgressReviewFormDialogProps {
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
  form: ReturnType<typeof useForm<ProgressReviewInput>>,
  result: ActionResult
) {
  if (!result.fieldErrors) return
  ;(Object.keys(result.fieldErrors) as (keyof ProgressReviewInput)[]).forEach(
    (field) => {
      const errors = result.fieldErrors?.[field]
      if (errors && errors.length > 0) {
        form.setError(field, { type: "server", message: errors[0] })
      }
    }
  )
}

export function ProgressReviewFormDialog({ clientId }: ProgressReviewFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProgressReviewInput>({
    resolver: zodResolver(progressReviewSchema),
    defaultValues: {
      reviewDate: todayInput(),
      adherencePct: "",
      energyLevel: "",
      trainerNotes: "",
    },
  })

  async function onSubmit(values: ProgressReviewInput) {
    setIsSubmitting(true)

    const payload = {
      reviewDate: values.reviewDate,
      adherencePct:
        values.adherencePct === "" ? "" : Number(values.adherencePct),
      energyLevel:
        values.energyLevel === "" ? "" : Number(values.energyLevel),
      trainerNotes: values.trainerNotes,
    }

    const result = await createProgressReviewAction(clientId, payload)

    if (!result.ok) {
      setFieldErrors(form, result)
      toast.error(result.error ?? "Something went wrong")
      return
    }

    toast.success("Progress review added")
    setOpen(false)
    form.reset({
      reviewDate: todayInput(),
      adherencePct: "",
      energyLevel: "",
      trainerNotes: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus />
          Add Progress Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Progress Review</DialogTitle>
          <DialogDescription>
            Record adherence, energy, and notes for this client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reviewDate">Review Date</Label>
            <Input
              id="reviewDate"
              type="date"
              {...form.register("reviewDate")}
            />
            {form.formState.errors.reviewDate && (
              <p className="text-sm text-destructive">
                {form.formState.errors.reviewDate.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adherencePct">Adherence (%)</Label>
              <Input
                id="adherencePct"
                type="number"
                min={0}
                max={100}
                placeholder="80"
                {...form.register("adherencePct", {
                  setValueAs: (v) => (v === "" || v === undefined ? "" : Number(v)),
                })}
              />
              {form.formState.errors.adherencePct && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.adherencePct.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="energyLevel">Energy Level (1-10)</Label>
              <Input
                id="energyLevel"
                type="number"
                min={1}
                max={10}
                placeholder="7"
                {...form.register("energyLevel", {
                  setValueAs: (v) => (v === "" || v === undefined ? "" : Number(v)),
                })}
              />
              {form.formState.errors.energyLevel && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.energyLevel.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trainerNotes">Trainer Notes (optional)</Label>
            <Textarea
              id="trainerNotes"
              rows={3}
              placeholder="Notes on adherence, energy, and next steps..."
              {...form.register("trainerNotes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add Review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
