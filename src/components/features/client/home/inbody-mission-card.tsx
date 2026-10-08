"use client"

import Link from "next/link"
import {
  Target,
  Scale,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"
import { motion } from "motion/react"
import { useI18n } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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

export function InBodyMissionCard({ mission }: InBodyMissionCardProps) {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight

  const isMissionActive = mission.isOverdue
  const daysLeft = Math.max(0, 30 - (mission.daysSince ?? 0))

  return (
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
                asChild
                className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold bg-gradient-to-r from-energy-600 via-energy-500 to-brand-600 text-white shadow-medium hover:brightness-110 transition-all duration-200 gap-2 text-sm"
              >
                <Link href="/client/profile?tab=inbody">
                  <Sparkles className="size-4" />
                  <span>{isAr ? "تحديث فحص InBody الآن" : "Update InBody Now"}</span>
                  <ArrowIcon className="size-4 rtl:-scale-x-100" />
                </Link>
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
                  {isAr
                    ? `آخر فحص مسجل منذ ${mission.daysSince ?? 0} يوماً — التذكير القادم بعد ${daysLeft} يوماً.`
                    : `Last scan logged ${mission.daysSince ?? 0} days ago — next check-in in ${daysLeft} days.`}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="shrink-0 rounded-xl text-xs gap-1.5 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              <Link href="/client/profile?tab=inbody">
                <Scale className="size-3.5" />
                <span>{isAr ? "عرض القياسات أو إضافة فحص" : "View Scans or Add New"}</span>
              </Link>
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
