"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"
import { Loader2, Pencil, Check } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { updateClientInfoAction } from "@/server/actions/update-client"
import type { Goal } from "@/lib/db/enums"
import { parseGoals } from "@/lib/goals"
import { MultiGoalPicker } from "@/components/features/goals/multi-goal-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface EditClientInfoDialogProps {
  clientId: string
  initial: {
    fullName: string
    phone: string
    birthDate: string
    goals: Goal[] | unknown
    status: string
    coachingMode: string
    workoutDisplayMode: string
  }
  trigger?: React.ReactNode
}


const STATUSES = [
  { value: "INVITED", labelEn: "Invited", labelAr: "مدعو" },
  { value: "PENDING_ASSESSMENT", labelEn: "Pending Assessment", labelAr: "بانتظار التقييم" },
  { value: "ACTIVE", labelEn: "Active", labelAr: "نشط" },
  { value: "PAUSED", labelEn: "Paused", labelAr: "متوقف" },
] as const

type FormValues = {
  fullName: string
  phone: string
  birthDate: string
  goals: Goal[]
  status: "INVITED" | "PENDING_ASSESSMENT" | "ACTIVE" | "PAUSED"
  coachingMode: "ONLINE" | "IN_PERSON"
  workoutDisplayMode: "FULL" | "DAY_NAME_ONLY"
}

export function EditClientInfoDialog({
  clientId,
  initial,
  trigger,
}: EditClientInfoDialogProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: {
      fullName: initial.fullName,
      phone: initial.phone,
      birthDate: initial.birthDate,
      goals: parseGoals(initial.goals),
      status: (initial.status as FormValues["status"]) || "ACTIVE",
      coachingMode: (initial.coachingMode as FormValues["coachingMode"]) || "ONLINE",
      workoutDisplayMode: (initial.workoutDisplayMode as FormValues["workoutDisplayMode"]) || "FULL",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    const result = await updateClientInfoAction(clientId, values)
    setIsSubmitting(false)

    if (result.ok) {
      toast.success(lookup(t, "client.profile.profileUpdated") || "Profile updated")
      setOpen(false)
      router.refresh()
    } else {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.length) {
            form.setError(field as keyof FormValues, {
              type: "server",
              message: messages[0],
            })
          }
        }
      }
      toast.error(result.error || "Something went wrong")
    }
  }

  const isAr = locale === "ar"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Pencil className="size-4" />
            {lookup(t, "client.profile.edit") || "Edit"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isAr ? "تعديل بيانات العميل" : "Edit Client Info"}</DialogTitle>
          <DialogDescription>
            {isAr ? "حدّث البيانات الشخصية للعميل" : "Update the client's personal information"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "الاسم الكامل" : "Full Name"} *</Label>
              <Input {...form.register("fullName")} />
              {form.formState.errors.fullName && (
                <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "رقم الهاتف" : "Phone"}</Label>
              <Input {...form.register("phone")} placeholder="01XXXXXXXXX" />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "تاريخ الميلاد" : "Birth Date"}</Label>
              <Input type="date" {...form.register("birthDate")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label>{isAr ? "الأهداف" : "Goals"}</Label>
                {(form.watch("goals")?.length ?? 0) > 0 && (
                  <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                    {isAr ? `(تم اختيار ${form.watch("goals").length})` : `(${form.watch("goals").length} selected)`}
                  </span>
                )}
              </div>
              <Controller
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <MultiGoalPicker
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{isAr ? "الحالة" : "Status"} *</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {isAr ? s.labelAr : s.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "وضع التدريب" : "Coaching Mode"}</Label>
              <Controller
                control={form.control}
                name="coachingMode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONLINE">{isAr ? "أونلاين" : "Online"}</SelectItem>
                      <SelectItem value="IN_PERSON">{isAr ? "حضوري" : "In Person"}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "عرض التمرين" : "Workout Display Mode"}</Label>
              <Controller
                control={form.control}
                name="workoutDisplayMode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL">{isAr ? "كامل" : "Full"}</SelectItem>
                      <SelectItem value="DAY_NAME_ONLY">{isAr ? "اسم اليوم فقط" : "Day Name Only"}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin me-2" />}
              {t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
