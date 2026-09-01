"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"
import { Loader2, Pencil } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { updateClientInfoAction } from "@/server/actions/update-client"
import type { Goal } from "@/lib/db/enums"
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
    goal: string
    status: string
    coachingMode: string
    workoutDisplayMode: string
  }
  trigger?: React.ReactNode
}

const GOALS = [
  { value: "WEIGHT_LOSS" as Goal, labelEn: "Weight Loss", labelAr: "إنقاص الوزن" },
  { value: "MUSCLE_BUILDING" as Goal, labelEn: "Muscle Building", labelAr: "بناء العضلات" },
  { value: "STRENGTH" as Goal, labelEn: "Strength", labelAr: "قوة" },
  { value: "GENERAL_FITNESS" as Goal, labelEn: "General Fitness", labelAr: "لياقة عامة" },
  { value: "WEIGHT_GAIN" as Goal, labelEn: "Weight Gain", labelAr: "زيادة الوزن" },
  { value: "REHAB" as Goal, labelEn: "Rehab", labelAr: "تأهيل" },
]

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
  goal: Goal | undefined
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
      goal: (initial.goal as Goal) || undefined,
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
            <div className="space-y-2">
              <Label>{isAr ? "الهدف" : "Goal"}</Label>
              <Controller
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={(v) => field.onChange(v || undefined)}>
                    <SelectTrigger>
                      <SelectValue placeholder={isAr ? "اختر الهدف" : "Select goal"} />
                    </SelectTrigger>
                    <SelectContent>
                      {GOALS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {isAr ? g.labelAr : g.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
