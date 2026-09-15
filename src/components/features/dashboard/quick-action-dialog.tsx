"use client"

import { useRouter } from "next/navigation"
import {
  UserPlus,
  Dumbbell,
  Apple,
  Newspaper,
  Crown,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n/client"
import { haptics } from "@/lib/haptics"

interface QuickActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickActionDialog({ open, onOpenChange }: QuickActionDialogProps) {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const router = useRouter()

  const actions = [
    {
      key: "invite",
      titleAr: "دعوة بطل جديد",
      titleEn: "Invite New Athlete",
      descAr: "انسخ رابط الانضمام أو رمز QR وشاركه مع البطل",
      descEn: "Share your invite link or QR code with the athlete",
      href: "/onboarding",
      icon: UserPlus,
      color: "from-brand-500 to-brand-600 text-white shadow-brand-500/25",
    },
    {
      key: "split",
      titleAr: "تصميم جدول تمارين جديد",
      titleEn: "New Workout Split Template",
      descAr: "أنشئ جدول تمارين مخصص أو سبليت عام لمكتبتك",
      descEn: "Create a customized workout split or reusable template",
      href: "/training-split-templates/new",
      icon: Dumbbell,
      color: "from-muscle-500 to-brand-500 text-white shadow-muscle-500/25",
    },
    {
      key: "nutrition",
      titleAr: "تصميم نظام غذائي جديد",
      titleEn: "New Nutrition Plan Template",
      descAr: "صمم خطة وجبات وسعرات مع البدائل ومكملات غذائية",
      descEn: "Build a macro meal plan with alternative meals and guides",
      href: "/nutrition-templates/new",
      icon: Apple,
      color: "from-energy-500 to-brand-500 text-white shadow-energy-500/25",
    },
    {
      key: "package",
      titleAr: "إضافة باقة تدريب جديدة",
      titleEn: "New Coaching Package",
      descAr: "حدد مدة الاشتراك أو عدد الحصص وسعر الباقة",
      descEn: "Define period or PT session bundle pricing for clients",
      href: "/subscription-plans/new",
      icon: Crown,
      color: "from-brand-600 to-energy-600 text-white shadow-brand-600/25",
    },
    {
      key: "blog",
      titleAr: "نشر مقال أو قصة نجاح",
      titleEn: "Publish Blog / Transformation",
      descAr: "شارك نصيحة أو قصة تحول ملهمة لأبطالك",
      descEn: "Share fitness tips or client transformation milestones",
      href: "/blog/new",
      icon: Newspaper,
      color: "from-performance-600 to-brand-500 text-white shadow-performance-600/25",
    },
  ]

  const handleActionClick = (href: string) => {
    haptics.selection()
    onOpenChange(false)
    router.push(href)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-5 shadow-2xl border bg-card/95 backdrop-blur-2xl">
        <DialogHeader className="pb-3 border-b text-start">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-400">
              <Sparkles className="size-4" />
            </span>
            <DialogTitle className="text-lg font-bold">
              {isAr ? "إضافة سريعة" : "Quick Create"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-2.5 pt-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => handleActionClick(action.href)}
                className="group flex w-full items-center justify-between rounded-xl border border-border/70 p-3 text-start transition-all duration-150 hover:border-brand-500/50 hover:bg-brand-500/[0.04] hover:shadow-soft"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ${action.color}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                      {isAr ? action.titleAr : action.titleEn}
                    </p>
                    <p className="text-xs text-muted-foreground leading-normal line-clamp-1">
                      {isAr ? action.descAr : action.descEn}
                    </p>
                  </div>
                </div>
                {isAr ? (
                  <ArrowLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-brand-600 shrink-0 ms-2" />
                ) : (
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand-600 shrink-0 ms-2" />
                )}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
