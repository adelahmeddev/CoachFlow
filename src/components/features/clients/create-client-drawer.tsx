"use client"

import { useState, useTransition, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  UserPlus,
  KeyRound,
  Sparkles,
  Phone,
  ShieldCheck,
  Scale,
  Activity,
  HeartPulse,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Copy,
  MessageCircle,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  X,
  Flame,
  Dumbbell,
  Check,
  User,
  Target,
  Sparkle,
  Calendar,
  CreditCard,
  Clock,
  Ticket,
  Pencil,
  ClipboardCheck,
} from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/client"
import { Goal, CoachingMode } from "@/lib/db/enums"
import { createClientManuallySchema, type CreateClientManuallyInput } from "@/lib/validations/client"
import { createClientManuallyAction } from "@/server/actions/client-management"
import { getTrainerSubscriptionPlansAction } from "@/server/actions/subscription-plan"
import { cn } from "@/lib/utils"

function generateRandomPassword(length = 8) {
  const letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ"
  const numbers = "23456789"
  const symbols = "!@#$%*"
  const allChars = letters + numbers + symbols

  let pass = ""
  pass += letters.charAt(Math.floor(Math.random() * letters.length))
  pass += numbers.charAt(Math.floor(Math.random() * numbers.length))
  pass += symbols.charAt(Math.floor(Math.random() * symbols.length))

  for (let i = 3; i < length; i++) {
    pass += allChars.charAt(Math.floor(Math.random() * allChars.length))
  }
  return pass
}

export interface AvailablePlanItem {
  id: string
  name: string
  planType: string
  durationDays?: number | null
  sessionsCount?: number | null
}

interface CreateClientDrawerProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  plans?: AvailablePlanItem[]
}

export function CreateClientDrawer({
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  plans: propPlans,
}: CreateClientDrawerProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [availablePlans, setAvailablePlans] = useState<AvailablePlanItem[]>(propPlans || [])
  const [selectedSubMode, setSelectedSubMode] = useState<"NONE" | "30_DAYS" | "90_DAYS" | "CUSTOM">("30_DAYS")
  const [createdData, setCreatedData] = useState<{
    phone: string
    password: string
    fullName: string
    subscriptionInfo?: string | null
  } | null>(null)

  // Sync propPlans
  useEffect(() => {
    if (propPlans && propPlans.length > 0) {
      setAvailablePlans(propPlans)
    }
  }, [propPlans])

  // Fetch plans if not provided when drawer opens
  useEffect(() => {
    if (isOpen && (!propPlans || propPlans.length === 0)) {
      getTrainerSubscriptionPlansAction()
        .then((res) => {
          if (res.ok && res.plans) {
            setAvailablePlans(res.plans as AvailablePlanItem[])
          }
        })
        .catch(() => {})
    }
  }, [isOpen, propPlans])

  // Auto-open if ?new=true is in the URL
  useEffect(() => {
    if (searchParams?.get("new") === "true") {
      handleOpenChange(true)
    }
  }, [searchParams])

  function handleOpenChange(newOpen: boolean) {
    if (isControlled) {
      setControlledOpen?.(newOpen)
    } else {
      setInternalOpen(newOpen)
    }

    if (!newOpen) {
      // Remove ?new=true from url if present
      if (searchParams?.get("new") === "true") {
        router.replace(pathname)
      }
      // Reset state after transition
      setTimeout(() => {
        setStep(1)
        setCreatedData(null)
        setSelectedSubMode("30_DAYS")
        form.reset()
      }, 300)
    }
  }

  const form = useForm<CreateClientManuallyInput>({
    resolver: zodResolver(createClientManuallySchema) as never,
    defaultValues: {
      fullName: "",
      phone: "",
      password: "",
      birthDate: "",
      goals: [],
      coachingMode: CoachingMode.ONLINE,
      subscriptionPlanId: null,
      subscriptionDurationDays: 30,
      subscriptionSessionsCount: null,
      subscriptionStartDate: new Date().toISOString().split("T")[0],
      weightKg: undefined,
      heightCm: undefined,
      muscleMassKg: undefined,
      bodyFatKg: undefined,
      bodyWaterPct: undefined,
      fatControlKg: undefined,
      bmrKcal: undefined,
      fitnessScore: undefined,
      waistHipRatio: undefined,
      visceralFatLevel: undefined,
      injuries: "",
      healthConditions: "",
      medications: "",
      neckPain: false,
      shoulderPain: false,
      backPain: false,
      kneePain: false,
    },
  })

  const { watch, setValue, formState: { errors } } = form
  const watchedValues = watch()

  // Generate initial random password when step 1 loads
  function handleGeneratePass() {
    const pwd = generateRandomPassword()
    setValue("password", pwd, { shouldValidate: true })
    toast.success(isAr ? "تم توليد كلمة مرور آمنة" : "Secure password generated", {
      icon: <Sparkles className="size-4 text-brand-500" />
    })
  }

  // Validate step 1 before moving to step 2
  async function goToStep2() {
    const valid = await form.trigger(["fullName", "phone", "password"])
    if (valid) {
      setStep(2)
    } else {
      toast.error(isAr ? "يرجى ملء البيانات الإلزامية المطلوبة أولاً" : "Please fill required account fields first")
    }
  }

  // Validate step 1 and jump to Review
  async function goToReview() {
    const valid = await form.trigger(["fullName", "phone", "password"])
    if (valid) {
      setStep(4)
    } else {
      toast.error(isAr ? "يرجى ملء البيانات الإلزامية في الخطوة الأولى أولاً" : "Please fill required account fields first")
    }
  }

  // Submit form at review step
  async function onSubmit(values: CreateClientManuallyInput) {
    setIsSubmitting(true)
    try {
      const res = await createClientManuallyAction(values)
      if (res.ok) {
        let subSummary: string | null = null
        if (values.subscriptionPlanId) {
          const matchedPlan = availablePlans.find((p) => p.id === values.subscriptionPlanId)
          subSummary = matchedPlan ? matchedPlan.name : (isAr ? "باقة اشتراك" : "Subscription Plan")
        } else if (values.subscriptionDurationDays) {
          const d = values.subscriptionDurationDays
          subSummary = d === 30 ? (isAr ? "شهر (30 يوم)" : "1 Month (30 days)") : d === 90 ? (isAr ? "3 شهور (90 يوم)" : "3 Months (90 days)") : `${d} ${isAr ? "يوم" : "days"}`
        } else if (values.subscriptionSessionsCount) {
          subSummary = `${values.subscriptionSessionsCount} ${isAr ? "جلسات" : "sessions"}`
        }

        setCreatedData({
          phone: values.phone,
          password: values.password,
          fullName: values.fullName,
          subscriptionInfo: subSummary,
        })
        setStep(5)
        toast.success(isAr ? "تم إنشاء حساب المتدرب بنجاح!" : "Client created successfully!", {
          icon: <CheckCircle2 className="size-4 text-emerald-500" />
        })
        router.refresh()
      } else {
        if (res.error === "PHONE_EXISTS") {
          toast.error(isAr ? "رقم الهاتف مسجل بالفعل لمتدرب آخر" : "This phone number is already registered")
          setStep(1)
        } else {
          toast.error(isAr ? "حدث خطأ أثناء الإضافة، يرجى المحاولة ثانية" : "Failed to create client")
        }
      }
    } catch {
      toast.error(isAr ? "حدث خطأ غير متوقع" : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Egyptian / International phone format for WhatsApp
  function formatWhatsAppPhone(rawPhone: string) {
    const digits = rawPhone.replace(/\D/g, "")
    if (digits.startsWith("01")) {
      return `2${digits}`
    }
    return digits
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://coach-flow-pi.vercel.app"
  const loginUrl = `${appUrl.replace(/\/$/, "")}/login`
  const waPhone = createdData ? formatWhatsAppPhone(createdData.phone) : ""

  const subText = createdData?.subscriptionInfo
    ? isAr
      ? `\n💳 الاشتراك المفعّل: ${createdData.subscriptionInfo}`
      : `\n💳 Active Subscription: ${createdData.subscriptionInfo}`
    : ""

  const waMessage = createdData
    ? isAr
      ? `📱 اسم المستخدم (رقم الهاتف): ${createdData.phone}\n🔑 كلمة المرور المؤقتة: ${createdData.password}${subText}\n\n🔗 رابط تسجيل الدخول المباشر:\n${loginUrl}`
      : `📱 Username (Phone Number): ${createdData.phone}\n🔑 Temporary Password: ${createdData.password}${subText}\n\n🔗 Direct Login Link:\n${loginUrl}`
    : ""

  const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`

  function handleCopy() {
    navigator.clipboard.writeText(waMessage)
    setCopied(true)
    toast.success(isAr ? "تم نسخ بيانات الدخول والرسالة" : "Credentials copied to clipboard")
    setTimeout(() => setCopied(false), 2500)
  }

  const NextIcon = isAr ? ArrowLeft : ArrowRight
  const PrevIcon = isAr ? ArrowRight : ArrowLeft

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      
      <SheetContent
        side="end"
        className="w-full sm:max-w-2xl p-0 flex flex-col bg-card border-border overflow-hidden"
      >
        {/* Compact Header with Stepper Indicator */}
        <div className="px-5 py-3.5 border-b border-border bg-card shrink-0">
          <SheetHeader className="text-start space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                  <UserPlus className="size-4" />
                </span>
                <div>
                  <SheetTitle className="text-base font-extrabold text-foreground leading-tight">
                    {step === 5 
                      ? (isAr ? "تم إنشاء حساب البطل! 🎉" : "Athlete Created! 🎉") 
                      : step === 4
                      ? (isAr ? "مراجعة وتأكيد البيانات" : "Review & Confirm")
                      : (isAr ? "إضافة متدرب يدوياً" : "Add Athlete Manually")}
                  </SheetTitle>
                  <SheetDescription className="text-[11px] text-muted-foreground leading-none mt-0.5">
                    {step === 1 && (isAr ? "بيانات الحساب والاشتراك" : "Login credentials & plan")}
                    {step === 2 && (isAr ? "قياسات الـ InBody (اختياري)" : "InBody metrics (optional)")}
                    {step === 3 && (isAr ? "التاريخ الطبي وآلام المفاصل (اختياري)" : "Medical history (optional)")}
                    {step === 4 && (isAr ? "راجع وتأكد من البيانات أو عدّلها قبل الحفظ" : "Review or edit data before saving")}
                    {step === 5 && (isAr ? "رسالة الواتساب جاهزة للإرسال" : "WhatsApp message ready")}
                  </SheetDescription>
                </div>
              </div>

              <Badge variant="outline" className="text-[10px] font-semibold border-brand-500/30 text-brand-500 bg-brand-500/10 shrink-0">
                {step === 5 ? (isAr ? "مكتمل" : "Completed") : `${isAr ? "مرحلة" : "Step"} ${step}/4`}
              </Badge>
            </div>
          </SheetHeader>

          {/* Compact 4-Step Pill Bar */}
          {step < 5 && (
            <div className="grid grid-cols-4 gap-1.5 mt-2.5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={cn(
                  "flex items-center justify-center gap-1 py-1 px-1 rounded-lg text-[11px] font-bold transition-all border",
                  step === 1
                    ? "bg-brand-500 text-white border-brand-500 shadow-xs"
                    : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                )}
              >
                <span className={cn(
                  "size-4 rounded-full flex items-center justify-center text-[10px]",
                  step === 1 ? "bg-white/25 text-white" : "bg-muted text-foreground"
                )}>
                  1
                </span>
                <span className="truncate">{isAr ? "الحساب" : "Account"}</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep2()}
                className={cn(
                  "flex items-center justify-center gap-1 py-1 px-1 rounded-lg text-[11px] font-bold transition-all border",
                  step === 2
                    ? "bg-brand-500 text-white border-brand-500 shadow-xs"
                    : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                )}
              >
                <span className={cn(
                  "size-4 rounded-full flex items-center justify-center text-[10px]",
                  step === 2 ? "bg-white/25 text-white" : "bg-muted text-foreground"
                )}>
                  2
                </span>
                <span className="truncate">{isAr ? "الـ InBody" : "InBody"}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const valid = await form.trigger(["fullName", "phone", "password"])
                  if (valid) setStep(3)
                }}
                className={cn(
                  "flex items-center justify-center gap-1 py-1 px-1 rounded-lg text-[11px] font-bold transition-all border",
                  step === 3
                    ? "bg-brand-500 text-white border-brand-500 shadow-xs"
                    : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                )}
              >
                <span className={cn(
                  "size-4 rounded-full flex items-center justify-center text-[10px]",
                  step === 3 ? "bg-white/25 text-white" : "bg-muted text-foreground"
                )}>
                  3
                </span>
                <span className="truncate">{isAr ? "الصحة" : "Health"}</span>
              </button>

              <button
                type="button"
                onClick={() => goToReview()}
                className={cn(
                  "flex items-center justify-center gap-1 py-1 px-1 rounded-lg text-[11px] font-bold transition-all border",
                  step === 4
                    ? "bg-brand-500 text-white border-brand-500 shadow-xs"
                    : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                )}
              >
                <span className={cn(
                  "size-4 rounded-full flex items-center justify-center text-[10px]",
                  step === 4 ? "bg-white/25 text-white" : "bg-muted text-foreground"
                )}>
                  4
                </span>
                <span className="truncate">{isAr ? "مراجعة" : "Review"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <form id="createClientForm" onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-5">
            
            {/* ========================================================= */}
            {/* STEP 1: ACCOUNT & CREDENTIALS */}
            {/* ========================================================= */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-4">
                  
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="drawer-fullName" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <User className="size-3.5 text-brand-500" />
                      <span>{isAr ? "اسم المتدرب بالكامل *" : "Full Name *"}</span>
                    </Label>
                    <Input
                      id="drawer-fullName"
                      placeholder={isAr ? "مثال: أحمد طارق الشافعي" : "e.g. Ahmed Tarek"}
                      {...form.register("fullName")}
                      className="rounded-xl h-11 text-sm bg-background border-border focus-visible:ring-brand-500"
                    />
                    {errors.fullName && (
                      <p className="text-xs text-destructive font-medium">{errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Phone (Username) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="drawer-phone" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Phone className="size-3.5 text-brand-500" />
                      <span>{isAr ? "رقم الهاتف (اسم المستخدم للدخول) *" : "Phone Number (Login Username) *"}</span>
                    </Label>
                    <Input
                      id="drawer-phone"
                      type="tel"
                      dir="ltr"
                      placeholder="01xxxxxxxxx"
                      {...form.register("phone")}
                      className="rounded-xl h-11 text-sm bg-background border-border text-foreground font-mono focus-visible:ring-brand-500 text-left px-3.5"
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive font-medium">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <Label htmlFor="drawer-birthDate" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-brand-500" />
                      <span>{isAr ? "تاريخ الميلاد (اختياري)" : "Date of Birth (Optional)"}</span>
                    </Label>
                    <Input
                      id="drawer-birthDate"
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      {...form.register("birthDate")}
                      className="rounded-xl h-11 text-sm bg-background border-border text-foreground focus-visible:ring-brand-500 px-3.5"
                    />
                  </div>

                  {/* Password with Auto-generate Button */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="drawer-password" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <KeyRound className="size-3.5 text-brand-500" />
                        <span>{isAr ? "كلمة المرور المؤقتة *" : "Temporary Password *"}</span>
                      </Label>
                      <button
                        type="button"
                        onClick={handleGeneratePass}
                        className="text-[11px] font-bold text-brand-500 hover:text-brand-600 flex items-center gap-1 transition-colors"
                      >
                        <Sparkles className="size-3" />
                        <span>{isAr ? "توليد تلقائي آمن" : "Generate Secure"}</span>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="drawer-password"
                        type="text"
                        dir="ltr"
                        placeholder={isAr ? "كلمة المرور (6 أحرف على الأقل)" : "At least 6 characters"}
                        {...form.register("password")}
                        className="rounded-xl h-11 text-sm bg-background border-border font-mono focus-visible:ring-brand-500"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGeneratePass}
                        className="h-11 w-11 rounded-xl shrink-0 border-border hover:bg-brand-500/10 hover:text-brand-500"
                        title={isAr ? "توليد كلمة مرور" : "Generate password"}
                      >
                        <Sparkles className="size-4" />
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
                    )}
                  </div>

                </div>

                {/* Coaching Mode & Goal */}
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Target className="size-3.5 text-brand-500" />
                      <span>{isAr ? "طريقة التدريب" : "Coaching Mode"}</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setValue("coachingMode", CoachingMode.ONLINE)}
                        className={cn(
                          "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center",
                          watchedValues.coachingMode === CoachingMode.ONLINE
                            ? "border-brand-500 bg-brand-500/10 text-brand-500"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {isAr ? "🌐 تدريب أونلاين" : "Online Coaching"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue("coachingMode", CoachingMode.IN_PERSON)}
                        className={cn(
                          "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center",
                          watchedValues.coachingMode === CoachingMode.IN_PERSON
                            ? "border-brand-500 bg-brand-500/10 text-brand-500"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {isAr ? "🏋️‍♂️ تدريب شخصي حضوري" : "In-Person PT"}
                      </button>
                    </div>
                  </div>

                  {/* Primary Goal Selector Chips */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Dumbbell className="size-3.5 text-brand-500" />
                      <span>{isAr ? "الهدف الرئيسي للتدريب" : "Primary Fitness Goal"}</span>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { goal: Goal.WEIGHT_LOSS, labelAr: "حرق دهون وإنقاص وزن", labelEn: "Weight Loss" },
                        { goal: Goal.MUSCLE_BUILDING, labelAr: "بناء عضلات وضخامة", labelEn: "Muscle Building" },
                        { goal: Goal.STRENGTH, labelAr: "زيادة القوة والتحمل", labelEn: "Strength" },
                        { goal: Goal.GENERAL_FITNESS, labelAr: "صحة ولياقة عامة", labelEn: "General Fitness" },
                      ].map((item) => {
                        const isSelected = watchedValues.goals?.includes(item.goal)
                        return (
                          <button
                            key={item.goal}
                            type="button"
                            onClick={() => {
                              const current = watchedValues.goals || []
                              if (isSelected) {
                                setValue("goals", current.filter((g) => g !== item.goal))
                              } else {
                                setValue("goals", [...current, item.goal])
                              }
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all",
                              isSelected
                                ? "border-brand-500 bg-brand-500 text-white shadow-sm"
                                : "border-border bg-background text-muted-foreground hover:border-brand-500/50"
                            )}
                          >
                            {isAr ? item.labelAr : item.labelEn}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Subscription Assignment Card */}
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <CreditCard className="size-3.5 text-brand-500" />
                      <span>{isAr ? "خطة الاشتراك للمتدرب" : "Assign Subscription"}</span>
                    </Label>
                    <Badge variant="outline" className="text-[10px] font-semibold border-brand-500/30 text-brand-500 bg-brand-500/10">
                      {isAr ? "اختياري" : "Optional"}
                    </Badge>
                  </div>

                  {/* Mode / Preset selection */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubMode("30_DAYS")
                          setValue("subscriptionPlanId", null)
                          setValue("subscriptionDurationDays", 30)
                          setValue("subscriptionSessionsCount", null)
                        }}
                        className={cn(
                          "py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                          selectedSubMode === "30_DAYS"
                            ? "border-brand-500 bg-brand-500/10 text-brand-500 shadow-xs"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {isAr ? "شهر (30 يوم)" : "1 Month"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubMode("90_DAYS")
                          setValue("subscriptionPlanId", null)
                          setValue("subscriptionDurationDays", 90)
                          setValue("subscriptionSessionsCount", null)
                        }}
                        className={cn(
                          "py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                          selectedSubMode === "90_DAYS"
                            ? "border-brand-500 bg-brand-500/10 text-brand-500 shadow-xs"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {isAr ? "3 شهور (90 يوم)" : "3 Months"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubMode("CUSTOM")
                          setValue("subscriptionPlanId", null)
                        }}
                        className={cn(
                          "py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                          selectedSubMode === "CUSTOM"
                            ? "border-brand-500 bg-brand-500/10 text-brand-500 shadow-xs"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {isAr ? "مخصص / باقاتك" : "Custom / Plans"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubMode("NONE")
                          setValue("subscriptionPlanId", null)
                          setValue("subscriptionDurationDays", null)
                          setValue("subscriptionSessionsCount", null)
                        }}
                        className={cn(
                          "py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                          selectedSubMode === "NONE"
                            ? "border-brand-500 bg-brand-500/10 text-brand-500 shadow-xs"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {isAr ? "بدون اشتراك" : "No Plan"}
                      </button>
                    </div>

                    {/* Custom details / Saved plans */}
                    {selectedSubMode === "CUSTOM" && (
                      <div className="p-3 rounded-xl bg-background border border-border space-y-3 animate-in fade-in-50 duration-200">
                        {availablePlans.length > 0 && (
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-muted-foreground">
                              {isAr ? "باقاتك المسجلة:" : "Your saved plans:"}
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {availablePlans.map((p) => {
                                const isSelected = watchedValues.subscriptionPlanId === p.id
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setValue("subscriptionPlanId", p.id)
                                      setValue("subscriptionDurationDays", p.durationDays || null)
                                      setValue("subscriptionSessionsCount", p.sessionsCount || null)
                                    }}
                                    className={cn(
                                      "p-2.5 rounded-xl border text-start text-xs font-bold transition-all flex items-center justify-between",
                                      isSelected
                                        ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-1 ring-brand-500"
                                        : "border-border bg-card text-foreground hover:bg-muted"
                                    )}
                                  >
                                    <span className="truncate">{p.name}</span>
                                    <Badge variant="secondary" className="text-[10px] shrink-0 ms-1">
                                      {p.planType === "SESSIONS"
                                        ? `${p.sessionsCount} ${isAr ? "جلسات" : "sessions"}`
                                        : `${p.durationDays} ${isAr ? "يوم" : "days"}`}
                                    </Badge>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                          <div className="space-y-1">
                            <Label htmlFor="drawer-customDays" className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3" />
                              <span>{isAr ? "مدة بالأيام (مخصص):" : "Custom days:"}</span>
                            </Label>
                            <Input
                              id="drawer-customDays"
                              type="number"
                              min={1}
                              max={1000}
                              placeholder={isAr ? "مثال: 60" : "e.g. 60"}
                              value={watchedValues.subscriptionDurationDays ?? ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? null : Number(e.target.value)
                                setValue("subscriptionDurationDays", val)
                                setValue("subscriptionPlanId", null)
                                setValue("subscriptionSessionsCount", null)
                              }}
                              className="h-9 rounded-lg text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="drawer-customSessions" className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                              <Ticket className="size-3" />
                              <span>{isAr ? "عدد جلسات (مخصص):" : "Custom sessions:"}</span>
                            </Label>
                            <Input
                              id="drawer-customSessions"
                              type="number"
                              min={1}
                              max={500}
                              placeholder={isAr ? "مثال: 12" : "e.g. 12"}
                              value={watchedValues.subscriptionSessionsCount ?? ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? null : Number(e.target.value)
                                setValue("subscriptionSessionsCount", val)
                                setValue("subscriptionPlanId", null)
                                setValue("subscriptionDurationDays", null)
                              }}
                              className="h-9 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Subscription Start Date */}
                    {selectedSubMode !== "NONE" && (
                      <div className="flex items-center gap-2 pt-1">
                        <Label htmlFor="drawer-subStartDate" className="text-[11px] font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
                          <Calendar className="size-3 text-brand-500" />
                          <span>{isAr ? "تاريخ بدء الاشتراك:" : "Start Date:"}</span>
                        </Label>
                        <Input
                          id="drawer-subStartDate"
                          type="date"
                          defaultValue={new Date().toISOString().split("T")[0]}
                          {...form.register("subscriptionStartDate")}
                          className="h-8 rounded-lg text-xs w-auto bg-background"
                        />
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 2: INBODY MEASUREMENTS (OPTIONAL) */}
            {/* ========================================================= */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Scale className="size-4 text-emerald-500" />
                      <span className="text-sm font-black text-foreground">{isAr ? "تقرير ومؤشرات InBody" : "InBody Report & Metrics"}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                      {isAr ? "اختياري" : "Optional"}
                    </Badge>
                  </div>

                  {/* 10 InBody Fields Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">{isAr ? "الوزن (Weight) كجم" : "Weight (kg)"}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="85.0"
                        {...form.register("weightKg", { setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
                        className="rounded-xl h-10 text-xs bg-background border-border text-center font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">{isAr ? "الطول (Height) سم" : "Height (cm)"}</Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="175"
                        {...form.register("heightCm", { setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
                        className="rounded-xl h-10 text-xs bg-background border-border text-center font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">{isAr ? "الكتلة العضلية (SMM) كجم" : "Muscle Mass (kg)"}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="35.0"
                        {...form.register("muscleMassKg", { setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
                        className="rounded-xl h-10 text-xs bg-background border-border text-center font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">{isAr ? "دهون الجسم (BFM) كجم" : "Body Fat (kg)"}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="20.0"
                        {...form.register("bodyFatKg", { setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
                        className="rounded-xl h-10 text-xs bg-background border-border text-center font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">{isAr ? "نسبة الماء % (TBW)" : "Body Water %"}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="55.0"
                        {...form.register("bodyWaterPct", { setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
                        className="rounded-xl h-10 text-xs bg-background border-border text-center font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">{isAr ? "معدل الأيض (BMR)" : "BMR (kcal)"}</Label>
                      <Input
                        type="number"
                        placeholder="1650"
                        {...form.register("bmrKcal", { setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
                        className="rounded-xl h-10 text-xs bg-background border-border text-center font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">{isAr ? "الدهون الحشوية (VFL)" : "Visceral Fat Level"}</Label>
                      <Input
                        type="number"
                        placeholder="8"
                        {...form.register("visceralFatLevel", { setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
                        className="rounded-xl h-10 text-xs bg-background border-border text-center font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">{isAr ? "مؤشر اللياقة (Score)" : "Fitness Score"}</Label>
                      <Input
                        type="number"
                        placeholder="70"
                        {...form.register("fitnessScore", { setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
                        className="rounded-xl h-10 text-xs bg-background border-border text-center font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">{isAr ? "التحكم في الدهون كجم" : "Fat Control (kg)"}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="-10.0"
                        {...form.register("fatControlKg", { setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
                        className="rounded-xl h-10 text-xs bg-background border-border text-center font-bold"
                      />
                    </div>

                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-2">
                    💡 {isAr 
                      ? "يمكنك ترك أي حقل فارغاً، وسيتم تذكير المتدرب بإكمال قياساته عند تسجيل الدخول الأول." 
                      : "You can leave any field empty; the athlete will be prompted to complete their profile upon logging in."}
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 3: MEDICAL HISTORY & JOINT PAIN */}
            {/* ========================================================= */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="size-4 text-red-500" />
                      <span className="text-sm font-black text-foreground">{isAr ? "مواضع آلام المفاصل" : "Joint Pain Assessment"}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-red-500 border-red-500/30 bg-red-500/10">
                      {isAr ? "سلامة المتدرب" : "Safety"}
                    </Badge>
                  </div>

                  {/* Joint Pain Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { key: "neckPain" as const, labelAr: "ألم الرقبة (Neck)", labelEn: "Neck Pain" },
                      { key: "shoulderPain" as const, labelAr: "ألم الكتف (Shoulder)", labelEn: "Shoulder Pain" },
                      { key: "backPain" as const, labelAr: "ألم الظهر (Back)", labelEn: "Back Pain" },
                      { key: "kneePain" as const, labelAr: "ألم الركبة (Knee)", labelEn: "Knee Pain" },
                    ].map((item) => {
                      const isActive = watchedValues[item.key]
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setValue(item.key, !isActive)}
                          className={cn(
                            "p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between gap-1",
                            isActive
                              ? "border-red-500/50 bg-red-500/15 text-red-400 shadow-sm"
                              : "border-border bg-background text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <span>{isAr ? item.labelAr : item.labelEn}</span>
                          {isActive ? <AlertTriangle className="size-3.5 text-red-500 shrink-0" /> : <div className="size-3.5 rounded-full border border-border" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Medical History Text Areas */}
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="drawer-injuries" className="text-xs font-bold text-foreground">
                      {isAr ? "الإصابات السابقة والعمليات" : "Past Injuries & Surgeries"}
                    </Label>
                    <Textarea
                      id="drawer-injuries"
                      rows={2}
                      placeholder={isAr ? "تمزق عضلي، انزلاق غضروفي، كسر قديم..." : "Muscle tear, herniated disc..."}
                      {...form.register("injuries")}
                      className="rounded-xl text-xs bg-background border-border resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="drawer-conditions" className="text-xs font-bold text-foreground">
                      {isAr ? "الحالات الصحية المزمنة والحساسية" : "Chronic Health Conditions"}
                    </Label>
                    <Textarea
                      id="drawer-conditions"
                      rows={2}
                      placeholder={isAr ? "ضغط، سكر، حساسية طعام، ربو..." : "Hypertension, diabetes, asthma..."}
                      {...form.register("healthConditions")}
                      className="rounded-xl text-xs bg-background border-border resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="drawer-medications" className="text-xs font-bold text-foreground">
                      {isAr ? "الأدوية والمكملات اليومية" : "Regular Medications & Supplements"}
                    </Label>
                    <Textarea
                      id="drawer-medications"
                      rows={2}
                      placeholder={isAr ? "أي أدوية يتم تناولها بانتظام..." : "Any regular daily medications..."}
                      {...form.register("medications")}
                      className="rounded-xl text-xs bg-background border-border resize-none"
                    />
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 4: REVIEW & MODIFICATION BEFORE FINAL SAVE */}
            {/* ========================================================= */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                
                {/* Review intro notice */}
                <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-start gap-3">
                  <div className="size-8 rounded-xl bg-brand-500/20 text-brand-500 flex items-center justify-center shrink-0 mt-0.5">
                    <ClipboardCheck className="size-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-foreground">
                      {isAr ? "مراجعة وتأكيد البيانات قبل الإضافة" : "Review Athlete Information"}
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {isAr
                        ? "تأكد من صحة البيانات المسجلة، يمكنك الضغط على 'تعديل' بجانب أي قسم للرجوع وتعديله قبل الحفظ النهائي."
                        : "Verify all data before saving. Click 'Edit' beside any section to modify its fields."}
                    </p>
                  </div>
                </div>

                {/* Card 1: Account & Profile Details */}
                <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <User className="size-3.5" />
                      </div>
                      <span className="text-xs font-black text-foreground">
                        {isAr ? "بيانات الحساب والتدريب" : "Account & Coaching Info"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setStep(1)}
                      className="h-7 px-2.5 rounded-lg text-[11px] font-bold text-brand-500 hover:text-brand-600 hover:bg-brand-500/10 gap-1.5"
                    >
                      <Pencil className="size-3" />
                      <span>{isAr ? "تعديل" : "Edit"}</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "الاسم بالكامل" : "Full Name"}</span>
                      <span className="font-bold text-foreground truncate block mt-0.5">{watchedValues.fullName || "-"}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "رقم الهاتف" : "Phone"}</span>
                      <span className="font-mono font-bold text-foreground truncate block mt-0.5 dir-ltr text-start">{watchedValues.phone || "-"}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "كلمة المرور المؤقتة" : "Password"}</span>
                      <span className="font-mono font-bold text-brand-500 truncate block mt-0.5 dir-ltr text-start">{watchedValues.password || "-"}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "تاريخ الميلاد" : "Date of Birth"}</span>
                      <span className="font-bold text-foreground truncate block mt-0.5">
                        {watchedValues.birthDate || (isAr ? "غير محدد" : "Not specified")}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "طريقة التدريب" : "Coaching Mode"}</span>
                      <span className="font-bold text-foreground block mt-0.5">
                        {watchedValues.coachingMode === CoachingMode.ONLINE
                          ? (isAr ? "🌐 أونلاين" : "Online")
                          : watchedValues.coachingMode === CoachingMode.IN_PERSON
                          ? (isAr ? "🏋️‍♂️ حضوري" : "In-Person")
                          : (isAr ? "هجين" : "Hybrid")}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "الأهداف المحددة" : "Goals"}</span>
                      {watchedValues.goals && watchedValues.goals.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {watchedValues.goals.map((g) => {
                            const label =
                              g === Goal.WEIGHT_LOSS
                                ? (isAr ? "إنقاص وزن" : "Weight Loss")
                                : g === Goal.MUSCLE_BUILDING
                                ? (isAr ? "بناء عضلات" : "Muscle")
                                : g === Goal.STRENGTH
                                ? (isAr ? "زيادة قوة" : "Strength")
                                : g === Goal.GENERAL_FITNESS
                                ? (isAr ? "صحة ولياقة" : "Fitness")
                                : g
                            return (
                              <Badge key={g} variant="secondary" className="text-[9px] py-0 px-1.5 font-bold">
                                {label}
                              </Badge>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground block mt-0.5">{isAr ? "غير محدد" : "None"}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card 2: Subscription Plan */}
                <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <CreditCard className="size-3.5" />
                      </div>
                      <span className="text-xs font-black text-foreground">
                        {isAr ? "الاشتراك والعضوية" : "Subscription & Plan"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setStep(1)}
                      className="h-7 px-2.5 rounded-lg text-[11px] font-bold text-brand-500 hover:text-brand-600 hover:bg-brand-500/10 gap-1.5"
                    >
                      <Pencil className="size-3" />
                      <span>{isAr ? "تعديل" : "Edit"}</span>
                    </Button>
                  </div>

                  {(() => {
                    const matchedPlan = watchedValues.subscriptionPlanId 
                      ? availablePlans.find((p) => p.id === watchedValues.subscriptionPlanId)
                      : null
                    const subName = matchedPlan
                      ? matchedPlan.name
                      : watchedValues.subscriptionDurationDays
                      ? (watchedValues.subscriptionDurationDays === 30
                          ? (isAr ? "شهر (30 يوم)" : "1 Month (30 days)")
                          : watchedValues.subscriptionDurationDays === 90
                          ? (isAr ? "3 شهور (90 يوم)" : "3 Months (90 days)")
                          : `${watchedValues.subscriptionDurationDays} ${isAr ? "يوم" : "days"}`)
                      : watchedValues.subscriptionSessionsCount
                      ? `${watchedValues.subscriptionSessionsCount} ${isAr ? "جلسات" : "sessions"}`
                      : (isAr ? "بدون اشتراك حالياً" : "No Plan")
                    
                    return (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                          <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "الاشتراك المفعّل" : "Plan"}</span>
                          <span className="font-bold text-emerald-500 block mt-0.5 truncate">{subName}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                          <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "تاريخ البداية" : "Start Date"}</span>
                          <span className="font-mono font-bold text-foreground block mt-0.5 dir-ltr text-start">
                            {watchedValues.subscriptionStartDate || new Date().toISOString().split("T")[0]}
                          </span>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Card 3: InBody & Body Metrics */}
                <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Scale className="size-3.5" />
                      </div>
                      <span className="text-xs font-black text-foreground">
                        {isAr ? "قياسات الـ InBody والجسم" : "InBody & Body Metrics"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setStep(2)}
                      className="h-7 px-2.5 rounded-lg text-[11px] font-bold text-brand-500 hover:text-brand-600 hover:bg-brand-500/10 gap-1.5"
                    >
                      <Pencil className="size-3" />
                      <span>{isAr ? "تعديل" : "Edit"}</span>
                    </Button>
                  </div>

                  {(!watchedValues.weightKg && !watchedValues.heightCm && !watchedValues.muscleMassKg && !watchedValues.bodyFatKg) ? (
                    <div className="p-3 rounded-xl bg-muted/20 text-center text-xs text-muted-foreground">
                      {isAr ? "لم يتم إدخال قياسات InBody (تم التخطي - يمكن إضافتها لاحقاً)" : "No InBody metrics entered (skipped)"}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {watchedValues.weightKg !== undefined && (
                        <div className="p-2 rounded-xl bg-muted/30 border border-border/40 text-center">
                          <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "الوزن" : "Weight"}</span>
                          <span className="font-black text-foreground">{watchedValues.weightKg} كجم</span>
                        </div>
                      )}
                      {watchedValues.heightCm !== undefined && (
                        <div className="p-2 rounded-xl bg-muted/30 border border-border/40 text-center">
                          <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "الطول" : "Height"}</span>
                          <span className="font-black text-foreground">{watchedValues.heightCm} سم</span>
                        </div>
                      )}
                      {watchedValues.muscleMassKg !== undefined && (
                        <div className="p-2 rounded-xl bg-muted/30 border border-border/40 text-center">
                          <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "العضلات" : "Muscle"}</span>
                          <span className="font-black text-foreground">{watchedValues.muscleMassKg} كجم</span>
                        </div>
                      )}
                      {watchedValues.bodyFatKg !== undefined && (
                        <div className="p-2 rounded-xl bg-muted/30 border border-border/40 text-center">
                          <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "الدهون" : "Body Fat"}</span>
                          <span className="font-black text-foreground">{watchedValues.bodyFatKg} كجم</span>
                        </div>
                      )}
                      {watchedValues.bodyWaterPct !== undefined && (
                        <div className="p-2 rounded-xl bg-muted/30 border border-border/40 text-center">
                          <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "نسبة الماء" : "Water %"}</span>
                          <span className="font-black text-foreground">{watchedValues.bodyWaterPct}%</span>
                        </div>
                      )}
                      {watchedValues.fatControlKg !== undefined && (
                        <div className="p-2 rounded-xl bg-muted/30 border border-border/40 text-center">
                          <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "التحكم بالدهون" : "Fat Control"}</span>
                          <span className="font-black text-foreground">{watchedValues.fatControlKg} كجم</span>
                        </div>
                      )}
                      {watchedValues.bmrKcal !== undefined && (
                        <div className="p-2 rounded-xl bg-muted/30 border border-border/40 text-center">
                          <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "الأيض BMR" : "BMR"}</span>
                          <span className="font-black text-foreground">{watchedValues.bmrKcal}</span>
                        </div>
                      )}
                      {watchedValues.fitnessScore !== undefined && (
                        <div className="p-2 rounded-xl bg-muted/30 border border-border/40 text-center">
                          <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "نقاط اللياقة" : "Score"}</span>
                          <span className="font-black text-foreground">{watchedValues.fitnessScore}/100</span>
                        </div>
                      )}
                      {watchedValues.visceralFatLevel !== undefined && (
                        <div className="p-2 rounded-xl bg-muted/30 border border-border/40 text-center">
                          <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "الدهون الحشوية" : "Visceral Fat"}</span>
                          <span className="font-black text-foreground">{watchedValues.visceralFatLevel}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card 4: Health & Joint Pains */}
                <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                        <HeartPulse className="size-3.5" />
                      </div>
                      <span className="text-xs font-black text-foreground">
                        {isAr ? "الحالة الصحية والمفاصل" : "Health & Injuries"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setStep(3)}
                      className="h-7 px-2.5 rounded-lg text-[11px] font-bold text-brand-500 hover:text-brand-600 hover:bg-brand-500/10 gap-1.5"
                    >
                      <Pencil className="size-3" />
                      <span>{isAr ? "تعديل" : "Edit"}</span>
                    </Button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-bold mb-1">
                        {isAr ? "آلام المفاصل:" : "Joint Pains:"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {watchedValues.neckPain && (
                          <Badge variant="destructive" className="text-[10px] py-0.5">
                            {isAr ? "ألم الرقبة" : "Neck Pain"}
                          </Badge>
                        )}
                        {watchedValues.shoulderPain && (
                          <Badge variant="destructive" className="text-[10px] py-0.5">
                            {isAr ? "ألم الكتف" : "Shoulder Pain"}
                          </Badge>
                        )}
                        {watchedValues.backPain && (
                          <Badge variant="destructive" className="text-[10px] py-0.5">
                            {isAr ? "ألم أسفل الظهر" : "Back Pain"}
                          </Badge>
                        )}
                        {watchedValues.kneePain && (
                          <Badge variant="destructive" className="text-[10px] py-0.5">
                            {isAr ? "ألم الركبة" : "Knee Pain"}
                          </Badge>
                        )}
                        {!watchedValues.neckPain && !watchedValues.shoulderPain && !watchedValues.backPain && !watchedValues.kneePain && (
                          <span className="text-muted-foreground text-[11px]">
                            {isAr ? "لا توجد آلام مفاصل محددة" : "No joint pains reported"}
                          </span>
                        )}
                      </div>
                    </div>

                    {(watchedValues.injuries || watchedValues.healthConditions || watchedValues.medications) && (
                      <div className="pt-2 border-t border-border/50 space-y-1.5 text-[11px]">
                        {watchedValues.injuries && (
                          <div>
                            <span className="font-bold text-foreground">{isAr ? "إصابات سابقة: " : "Injuries: "}</span>
                            <span className="text-muted-foreground">{watchedValues.injuries}</span>
                          </div>
                        )}
                        {watchedValues.healthConditions && (
                          <div>
                            <span className="font-bold text-foreground">{isAr ? "حالات صحية: " : "Conditions: "}</span>
                            <span className="text-muted-foreground">{watchedValues.healthConditions}</span>
                          </div>
                        )}
                        {watchedValues.medications && (
                          <div>
                            <span className="font-bold text-foreground">{isAr ? "أدوية منتظمة: " : "Medications: "}</span>
                            <span className="text-muted-foreground">{watchedValues.medications}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 5: SUCCESS & WHATSAPP DELIVERY STATE */}
            {/* ========================================================= */}
            {step === 5 && createdData && (
              <div className="space-y-5 animate-in zoom-in-95 duration-200">
                
                {/* Celebration Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 text-center space-y-2">
                  <div className="size-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <Check className="size-6 stroke-[3]" />
                  </div>
                  <h3 className="text-base font-black text-foreground">{createdData.fullName}</h3>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? "أصبح البطل مسجلاً بنشاط في حسابك ويمكنه الدخول الآن!" : "The athlete is now registered and ready to log in!"}
                  </p>
                </div>

                {/* Credentials Quick Info Cards */}
                <div className={cn("grid gap-2.5", createdData.subscriptionInfo ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-3")}>
                  <div className="p-3 rounded-xl border border-border bg-card">
                    <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "اسم المستخدم (الهاتف)" : "Username (Phone)"}</span>
                    <span className="text-xs font-mono font-bold text-foreground block mt-0.5 dir-ltr text-start">{createdData.phone}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-card">
                    <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "كلمة المرور المؤقتة" : "Password"}</span>
                    <span className="text-xs font-mono font-bold text-brand-500 block mt-0.5 dir-ltr text-start">{createdData.password}</span>
                  </div>
                  {createdData.subscriptionInfo && (
                    <div className="p-3 rounded-xl border border-border bg-card">
                      <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "الاشتراك المفعّل" : "Subscription"}</span>
                      <span className="text-xs font-bold text-emerald-500 block mt-0.5 truncate">{createdData.subscriptionInfo}</span>
                    </div>
                  )}
                  <div className="p-3 rounded-xl border border-border bg-card">
                    <span className="text-[10px] text-muted-foreground block font-bold">{isAr ? "رابط تسجيل الدخول" : "Login URL"}</span>
                    <span className="text-xs font-mono text-muted-foreground block mt-0.5 truncate dir-ltr text-start">{loginUrl}</span>
                  </div>
                </div>

                {/* Prepared WhatsApp Message Preview Card */}
                <div className="p-4 rounded-2xl border border-emerald-900/30 bg-[#0B141B] space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-emerald-400 font-bold font-sans">
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="size-4" />
                      <span>{isAr ? "معاينة رسالة WhatsApp المجهزة" : "WhatsApp Message Preview"}</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-mono">
                      wa.me/{waPhone}
                    </Badge>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-900/40 text-emerald-100/90 whitespace-pre-line leading-relaxed text-[11px]">
                    {waMessage}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 font-sans">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      <MessageCircle className="size-4" />
                      <span>{isAr ? "إرسال عبر واتساب الآن" : "Send via WhatsApp"}</span>
                      <ExternalLink className="size-3.5 opacity-80" />
                    </a>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopy}
                      className="rounded-xl h-auto py-3 px-3.5 border-border hover:bg-muted text-xs font-bold shrink-0"
                    >
                      {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                      <span className="ms-1.5">{copied ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ" : "Copy")}</span>
                    </Button>
                  </div>
                </div>

              </div>
            )}

          </form>
        </div>

        {/* Drawer Bottom Controls */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3">
          {step === 1 && (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="rounded-xl text-xs font-semibold text-muted-foreground"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goToReview}
                  className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  {isAr ? "تخطي للمراجعة" : "Skip to Review"}
                </Button>
                <Button
                  type="button"
                  onClick={goToStep2}
                  className="rounded-xl px-5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
                >
                  <span>{isAr ? "التالي: قياسات الـ InBody" : "Next: InBody"}</span>
                  <NextIcon className="size-3.5" />
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-xl text-xs font-bold border-border"
              >
                <PrevIcon className="size-3.5 me-1.5" />
                <span>{isAr ? "السابق" : "Back"}</span>
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(4)}
                  className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  {isAr ? "تخطي للمراجعة" : "Skip to Review"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-xl px-5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
                >
                  <span>{isAr ? "التالي: التاريخ الطبي" : "Next: Health"}</span>
                  <NextIcon className="size-3.5" />
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="rounded-xl text-xs font-bold border-border"
              >
                <PrevIcon className="size-3.5 me-1.5" />
                <span>{isAr ? "السابق" : "Back"}</span>
              </Button>
              
              <Button
                type="button"
                onClick={() => setStep(4)}
                className="rounded-xl px-5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <span>{isAr ? "التالي: مراجعة وتأكيد البيانات" : "Next: Review & Confirm"}</span>
                <NextIcon className="size-3.5" />
              </Button>
            </>
          )}

          {step === 4 && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(3)}
                className="rounded-xl text-xs font-bold border-border"
              >
                <PrevIcon className="size-3.5 me-1.5" />
                <span>{isAr ? "السابق" : "Back"}</span>
              </Button>

              <Button
                type="button"
                onClick={() => {
                  form.handleSubmit(
                    (values) => onSubmit(values),
                    (errs) => {
                      console.error("Form validation failed:", errs)
                      const firstErrKey = Object.keys(errs)[0]
                      const firstErrMsg = (errs as Record<string, { message?: string }>)[firstErrKey]?.message
                      toast.error(
                        firstErrMsg 
                          ? String(firstErrMsg) 
                          : (isAr ? "يرجى مراجعة البيانات في المراحل السابقة" : "Please check your inputs")
                      )
                      if (firstErrKey === "fullName" || firstErrKey === "phone" || firstErrKey === "password") {
                        setStep(1)
                      } else if (firstErrKey?.includes("Kg") || firstErrKey?.includes("Cm") || firstErrKey?.includes("Pct")) {
                        setStep(2)
                      }
                    }
                  )()
                }}
                disabled={isSubmitting}
                className="rounded-xl px-6 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white text-xs font-black flex items-center gap-2 shadow-md hover:brightness-110"
              >
                {isSubmitting ? (
                  <span>{isAr ? "جاري الحفظ والإنشاء..." : "Creating Client..."}</span>
                ) : (
                  <>
                    <span>{isAr ? "تأكيد وإنشاء المتدرب" : "Confirm & Create Athlete"}</span>
                    <Sparkles className="size-3.5" />
                  </>
                )}
              </Button>
            </>
          )}

          {step === 5 && (
            <Button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="w-full rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs"
            >
              {isAr ? "تم، إغلاق والعودة لقائمة الأبطال" : "Done, back to Athletes"}
            </Button>
          )}
        </div>

      </SheetContent>
    </Sheet>
  )
}
