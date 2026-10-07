"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Target,
  Scale,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Dumbbell,
  Activity,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/dialog"
import { createBodyCompositionAction } from "@/server/actions/body-composition"
import { haptics } from "@/lib/haptics"
import { cn } from "@/lib/utils"

export interface InBodyMissionData {
  isOverdue: boolean
  neverLogged: boolean
  daysSince: number | null
  lastDate: string | null
}

interface InBodyMissionCardProps {
  clientId: string
  mission: InBodyMissionData
}

export function InBodyMissionCard({ clientId, mission }: InBodyMissionCardProps) {
  const { locale } = useI18n()
  const router = useRouter()
  const isAr = locale === "ar"
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight

  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)

  // Form inputs
  const todayStr = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(todayStr)
  const [weightKg, setWeightKg] = useState("")
  const [muscleMassKg, setMuscleMassKg] = useState("")
  const [bodyFatKg, setBodyFatKg] = useState("")
  const [heightCm, setHeightCm] = useState("")
  const [notes, setNotes] = useState("")
  const [weightError, setWeightError] = useState("")

  const isMissionActive = (mission.isOverdue || justCompleted === false) && !justCompleted
  const isCompleted = !mission.isOverdue || justCompleted

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setWeightError("")

    const numWeight = parseFloat(weightKg)
    if (!weightKg || isNaN(numWeight) || numWeight <= 0 || numWeight >= 500) {
      setWeightError(isAr ? "يرجى إدخال وزن صحيح بالكيلوجرام (مثال: 75.5)" : "Please enter a valid weight in kg")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        date,
        weightKg: numWeight,
        muscleMassKg: muscleMassKg && !isNaN(parseFloat(muscleMassKg)) ? parseFloat(muscleMassKg) : null,
        bodyFatKg: bodyFatKg && !isNaN(parseFloat(bodyFatKg)) ? parseFloat(bodyFatKg) : null,
        heightCm: heightCm && !isNaN(parseFloat(heightCm)) ? parseFloat(heightCm) : null,
        notes: notes.trim() || null,
      }

      const res = await createBodyCompositionAction(clientId, payload)
      if (!res.ok) {
        toast.error((res as { error?: string }).error || (isAr ? "حدث خطأ أثناء الحفظ" : "Failed to save"))
        setIsSubmitting(false)
        return
      }

      haptics.success()
      toast.success(
        isAr
          ? "عاش يا بطل! 🎉 تم تسجيل فحص الـ InBody وإكمال المهمة بنجاح!"
          : "Awesome! 🎉 InBody logged and mission completed successfully!"
      )
      setJustCompleted(true)
      setIsOpen(false)
      router.refresh()
    } catch {
      toast.error(isAr ? "حدث خطأ غير متوقع" : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {isMissionActive ? (
          /* ACTIVE MISSION CARD */
          <div className="relative overflow-hidden rounded-2xl border border-energy-500/30 bg-gradient-to-br from-card via-card to-energy-500/[0.06] p-4 sm:p-5 shadow-medium transition-all duration-300 hover:border-energy-500/50">
            {/* Top decorative gradient glow */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-energy-500 via-amber-500 to-brand-500"
              aria-hidden="true"
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Left / Info side */}
              <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
                <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-energy-500 to-brand-600 text-white shadow-soft ring-2 ring-energy-500/20">
                  <Scale className="size-6 animate-pulse" />
                  <span className="absolute -top-1 -end-1 flex size-3">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-energy-400 opacity-75" />
                    <span className="relative inline-flex size-3 rounded-full bg-energy-500" />
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-energy-500/15 px-2.5 py-0.5 text-xs font-extrabold text-energy-700 dark:text-energy-300 border border-energy-500/30">
                      <Target className="size-3.5 text-energy-600 dark:text-energy-400" />
                      {mission.neverLogged
                        ? (isAr ? "مهمة البداية المطلوبة" : "Required Baseline Mission")
                        : (isAr ? "مهمة التحديث الشهري" : "Monthly Mission")}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-muscle-500/10 px-2 py-0.5 text-[11px] font-semibold text-muscle-700 dark:text-muscle-300">
                      <Clock className="size-3" />
                      {mission.neverLogged
                        ? (isAr ? "لم يسجل بعد" : "Not logged yet")
                        : (isAr ? `آخر فحص منذ ${mission.daysSince} يوم` : `Last scan ${mission.daysSince}d ago`)}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground">
                    {mission.neverLogged
                      ? (isAr ? "المهمة: تسجيل فحص InBody الأولي" : "Mission: Log Baseline InBody Scan")
                      : (isAr ? "المهمة: تحديث فحص الـ InBody الشهري" : "Mission: Monthly InBody Scan Update")}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {mission.neverLogged
                      ? (isAr
                          ? "تسجيل قياساتك خطوة أساسية لتمكين مدربك من تصميم خطتك وضبط السعرات وتتبع الكتلة العضلية ونسبة الدهون بدقة."
                          : "Recording your metrics helps your coach calibrate your training and nutrition plan based on your exact body composition.")
                      : (isAr
                          ? `مر أكثر من شهر (${mission.daysSince} يوماً) على آخر تحليل InBody. حان وقت إجراء فحص جديد وتحديث بياناتك لمتابعة تطورك.`
                          : `It's been over a month (${mission.daysSince} days) since your last InBody scan. Log a new scan to track your ongoing transformation.`)}
                  </p>
                </div>
              </div>

              {/* Right / CTA Button */}
              <div className="shrink-0 pt-1 sm:pt-0">
                <Button
                  onClick={() => {
                    haptics.selection()
                    setIsOpen(true)
                  }}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold bg-gradient-to-r from-energy-600 via-energy-500 to-brand-600 text-white shadow-medium hover:brightness-110 transition-all duration-200 gap-2 text-sm"
                >
                  <Sparkles className="size-4" />
                  <span>{isAr ? "إكمال المهمة الآن" : "Complete Mission Now"}</span>
                  <ArrowIcon className="size-4 rtl:-scale-x-100" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* COMPLETED MISSION CARD */
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] to-card p-3.5 sm:p-4 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">
                      {isAr ? "مهمة الـ InBody مكتملة لهذا الشهر 🎉" : "InBody Mission Completed 🎉"}
                    </p>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      {isAr ? "محدث ومتابع" : "Up to date"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {justCompleted
                      ? (isAr ? "تم تسجيل قياساتك بنجاح ومدربك يتابع تقدمك الآن!" : "Your scan was logged and your coach can review it now!")
                      : (isAr ? `آخر فحص مسجل منذ ${mission.daysSince ?? 0} يوماً — استمر في الالتزام!` : `Last scan logged ${mission.daysSince ?? 0} days ago — keep up the great work!`)}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  haptics.selection()
                  setIsOpen(true)
                }}
                className="shrink-0 rounded-xl text-xs gap-1.5 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <Scale className="size-3.5" />
                <span>{isAr ? "تسجيل قياس جديد" : "Log New Scan"}</span>
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* INBODY ENTRY DIALOG / MODAL */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader className="text-start">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-energy-500 to-brand-600 text-white shadow-soft">
                <Scale className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {isAr ? "تسجيل فحص InBody | إكمال المهمة" : "Log InBody Scan | Mission Check-in"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {isAr
                    ? "سجّل قياساتك الحالية لتحديث ملفك البدني وإكمال المهمة بنجاح"
                    : "Enter your current measurements to complete the mission"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="inbody-date" className="text-xs font-bold text-foreground">
                {isAr ? "تاريخ الفحص" : "Scan Date"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="inbody-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSubmitting}
                className="rounded-xl h-10"
                required
              />
            </div>

            {/* Weight */}
            <div className="space-y-1.5">
              <Label htmlFor="inbody-weight" className="text-xs font-bold text-foreground">
                {isAr ? "الوزن الحالي (كجم)" : "Weight (kg)"} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="inbody-weight"
                  type="number"
                  step="0.1"
                  min="20"
                  max="400"
                  placeholder="مثال: 82.5"
                  value={weightKg}
                  onChange={(e) => {
                    setWeightKg(e.target.value)
                    if (weightError) setWeightError("")
                  }}
                  disabled={isSubmitting}
                  className={cn("rounded-xl h-10 font-bold", weightError && "border-destructive")}
                  required
                />
                <span className="absolute end-3 top-2.5 text-xs font-semibold text-muted-foreground pointer-events-none">
                  kg
                </span>
              </div>
              {weightError && <p className="text-xs text-destructive">{weightError}</p>}
            </div>

            {/* Muscle Mass & Body Fat */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="inbody-muscle" className="text-xs font-medium text-muted-foreground">
                  {isAr ? "الكتلة العضلية (كجم)" : "Muscle Mass (kg)"}
                </Label>
                <Input
                  id="inbody-muscle"
                  type="number"
                  step="0.1"
                  placeholder="مثال: 34.0"
                  value={muscleMassKg}
                  onChange={(e) => setMuscleMassKg(e.target.value)}
                  disabled={isSubmitting}
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inbody-fat" className="text-xs font-medium text-muted-foreground">
                  {isAr ? "وزن الدهون (كجم)" : "Body Fat (kg)"}
                </Label>
                <Input
                  id="inbody-fat"
                  type="number"
                  step="0.1"
                  placeholder="مثال: 18.5"
                  value={bodyFatKg}
                  onChange={(e) => setBodyFatKg(e.target.value)}
                  disabled={isSubmitting}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            {/* Height (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="inbody-height" className="text-xs font-medium text-muted-foreground">
                {isAr ? "الطول (سم)" : "Height (cm)"}
              </Label>
              <Input
                id="inbody-height"
                type="number"
                step="0.5"
                placeholder="مثال: 178"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                disabled={isSubmitting}
                className="rounded-xl h-10"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="inbody-notes" className="text-xs font-medium text-muted-foreground">
                {isAr ? "ملاحظات إضافية (اختياري)" : "Notes (Optional)"}
              </Label>
              <Textarea
                id="inbody-notes"
                placeholder={isAr ? "أي تفاصيل أو ملاحظات حول قياساتك..." : "Any details about your scan..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                rows={2}
                className="rounded-xl resize-none text-xs"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-gradient-to-r from-energy-600 via-energy-500 to-brand-600 text-white font-bold gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{isAr ? "جارٍ الحفظ..." : "Saving..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>{isAr ? "حفظ وإكمال المهمة 🎉" : "Save & Complete Mission 🎉"}</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
