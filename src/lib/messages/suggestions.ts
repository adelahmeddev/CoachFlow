import type { Locale } from "@/lib/i18n/config"

export type Suggestion = {
  id: string
  labelAr: string
  labelEn: string
  insertAr: string
  insertEn: string
  icon?: string
  ctx?: "nutrition" | "workout" | "inbody" | "general"
}

export const TRAINER_SUGGESTIONS: Suggestion[] = [
  {
    id: "nutri-adherence",
    labelAr: "التزام التغذية",
    labelEn: "Nutrition check",
    insertAr: "كيف كان التزامك بخطة التغذية هذا الأسبوع؟ هل واجهت أي صعوبة؟",
    insertEn: "How was your adherence to the nutrition plan this week? Any difficulties?",
    ctx: "nutrition",
  },
  {
    id: "nutri-adjust",
    labelAr: "تعديل سعرات",
    labelEn: "Adjust calories",
    insertAr: "هل تحتاج تعديل في السعرات أو الماكروز؟ أخبرني بوزنك الحالي.",
    insertEn: "Do you need to adjust calories/macros? Tell me your current weight.",
    ctx: "nutrition",
  },
  {
    id: "workout-today",
    labelAr: "تمرين اليوم",
    labelEn: "Today's workout",
    insertAr: "كيف كان تمرين اليوم؟ هل الأوزان مناسبة أم نزيد في المرة القادمة؟",
    insertEn: "How was today's workout? Were the weights good or should we increase next time?",
    ctx: "workout",
  },
  {
    id: "workout-difficulty",
    labelAr: "صعوبة التمرين",
    labelEn: "Exercise difficulty",
    insertAr: "هل تواجه صعوبة في أي تمرين؟ يمكننا استبداله ببديل مناسب.",
    insertEn: "Are you struggling with any exercise? We can swap it for an alternative.",
    ctx: "workout",
  },
  {
    id: "inbody-reminder",
    labelAr: "تذكير InBody",
    labelEn: "InBody reminder",
    insertAr: "لا تنس تسجيل قياس InBody الجديد عند زيارتك القادمة.",
    insertEn: "Don't forget to log your new InBody measurement on your next visit.",
    ctx: "inbody",
  },
  {
    id: "sleep-energy",
    labelAr: "نوم وطاقة",
    labelEn: "Sleep & energy",
    insertAr: "كيف نومك وطاقتك هذا الأسبوع؟ هذا يؤثر على التقدم.",
    insertEn: "How is your sleep & energy this week? It affects progress.",
    ctx: "general",
  },
  {
    id: "weight-log",
    labelAr: "تسجيل وزن",
    labelEn: "Log weight",
    insertAr: "برجاء تسجيل وزن اليوم في التطبيق.",
    insertEn: "Please log today's weight in the app.",
    ctx: "inbody",
  },
  {
    id: "great-job",
    labelAr: "تحفيز",
    labelEn: "Motivation",
    insertAr: "أحسنت! استمر على نفس الوتيرة، التقدم واضح 👏",
    insertEn: "Great job! Keep going, progress is showing 👏",
    ctx: "general",
  },
]

export const CLIENT_SUGGESTIONS: Suggestion[] = [
  {
    id: "q-nutrition",
    labelAr: "سؤال تغذية",
    labelEn: "Nutrition Q",
    insertAr: "عندي سؤال بخصوص خطة التغذية: ",
    insertEn: "I have a question about my nutrition plan: ",
    ctx: "nutrition",
  },
  {
    id: "hard-workout",
    labelAr: "تمرين صعب",
    labelEn: "Hard workout",
    insertAr: "تمرين اليوم كان صعب، هل يمكن تعديل الأوزان؟",
    insertEn: "Today's workout was hard, can we adjust the weights?",
    ctx: "workout",
  },
  {
    id: "adjust-plan",
    labelAr: "تعديل الخطة",
    labelEn: "Adjust plan",
    insertAr: "هل يمكن تعديل الخطة؟ أواجه صعوبة في الالتزام.",
    insertEn: "Can we adjust the plan? I'm having trouble sticking to it.",
    ctx: "general",
  },
  {
    id: "logged-weight",
    labelAr: "سجلت الوزن",
    labelEn: "Logged weight",
    insertAr: "سجلت وزن اليوم: ",
    insertEn: "Logged today's weight: ",
    ctx: "inbody",
  },
  {
    id: "soreness",
    labelAr: "ألم عضلي",
    labelEn: "Soreness",
    insertAr: "أشعر بألم في العضلات بعد التمرين، هل هذا طبيعي؟",
    insertEn: "I feel muscle soreness after workout, is this normal?",
    ctx: "workout",
  },
]

export function labelFor(s: Suggestion, locale: Locale) {
  return locale === "ar" ? s.labelAr : s.labelEn
}
export function insertFor(s: Suggestion, locale: Locale) {
  return locale === "ar" ? s.insertAr : s.insertEn
}

// Mentions that insert templated prefix
export const MENTIONS: Suggestion[] = [
  {
    id: "mention-nutrition",
    labelAr: "@تغذية",
    labelEn: "@nutrition",
    insertAr: "بخصوص خطة التغذية: ",
    insertEn: "Regarding nutrition plan: ",
    ctx: "nutrition",
  },
  {
    id: "mention-workout",
    labelAr: "@تمرين",
    labelEn: "@workout",
    insertAr: "بخصوص جدول التمرين: ",
    insertEn: "Regarding training split: ",
    ctx: "workout",
  },
  {
    id: "mention-inbody",
    labelAr: "@InBody",
    labelEn: "@InBody",
    insertAr: "بخصوص تحليل InBody: ",
    insertEn: "Regarding InBody: ",
    ctx: "inbody",
  },
  {
    id: "mention-sub",
    labelAr: "@اشتراك",
    labelEn: "@subscription",
    insertAr: "بخصوص الاشتراك: ",
    insertEn: "Regarding subscription: ",
    ctx: "general",
  },
]

// Contextual picks: if client context provided, prioritize
export type ClientContext = {
  hasNutritionPlan?: boolean
  hasSplit?: boolean
  hasInBody?: boolean
  subscriptionStatus?: string | null
}

export function pickSuggestions(
  role: "COACH" | "CLIENT",
  locale: Locale,
  ctx?: ClientContext,
  limit = 6
): Suggestion[] {
  const base = role === "COACH" ? TRAINER_SUGGESTIONS : CLIENT_SUGGESTIONS
  if (!ctx) return base.slice(0, limit)
  // score by context
  const scored = base.map((s) => {
    let score = 0
    if (s.ctx === "nutrition" && ctx.hasNutritionPlan) score += 2
    if (s.ctx === "workout" && ctx.hasSplit) score += 2
    if (s.ctx === "inbody" && ctx.hasInBody) score += 1
    if (s.ctx === "general") score += 0.5
    return { s, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((x) => x.s)
}
