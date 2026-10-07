import type { NeedActionItem, NeedActionKind } from "@/lib/needs-action"
import type { getI18n } from "@/lib/i18n"
import { interpolate } from "@/lib/i18n/format"

type T = Awaited<ReturnType<typeof getI18n>>["t"]

export function actionText(item: NeedActionItem, t: T): string {
  const name = item.clientName ?? "—"
  switch (item.kind) {
    case "inactive_5d":
      return item.days === null
        ? interpolate(t.needsAction.inactive5dNever, { name })
        : interpolate(t.needsAction.inactive5d, { name, n: item.days })
    case "inactive_3d":
      return interpolate(t.needsAction.inactive3d, { name, n: item.days ?? 0 })
    case "sub_expired":
      return interpolate(t.needsAction.subExpired, { name })
    case "sub_expiring":
      return interpolate(t.needsAction.subExpiring, { name, n: item.days ?? 0 })
    case "no_inbody":
      return item.days === null
        ? interpolate(t.needsAction.noInbodyNever, { name })
        : interpolate(t.needsAction.noInbodyOverdue, { name, n: item.days })
    case "payment_pending":
      return interpolate(t.needsAction.paymentPending, { name, n: item.count ?? 0 })
    case "missed_checkin":
      return interpolate(t.needsAction.missedCheckin, { name })
    case "checkin_today":
      return interpolate(t.needsAction.checkinToday, { name })
    case "media_pending":
      return interpolate(t.needsAction.mediaPending, { name, n: item.count ?? 0 })
    case "goal_deadline":
      return interpolate(t.needsAction.goalDeadline, {
        name,
        title: item.title ?? "",
        n: item.days ?? 0,
      })
  }
}

export function getKindBadgeLabel(kind: NeedActionKind, isAr: boolean): string {
  switch (kind) {
    case "inactive_5d":
      return isAr ? "غير نشط (5+ أيام)" : "Inactive 5d+"
    case "inactive_3d":
      return isAr ? "غير نشط (3+ أيام)" : "Inactive 3d+"
    case "sub_expired":
      return isAr ? "اشتراك منتهي" : "Subscription expired"
    case "sub_expiring":
      return isAr ? "اشتراك يوشك على الانتهاء" : "Subscription expiring"
    case "no_inbody":
      return isAr ? "تحليل InBody مطلوب" : "InBody Required"
    case "payment_pending":
      return isAr ? "إثبات دفع معلق" : "Payment pending"
    case "missed_checkin":
      return isAr ? "تسجيل فائت" : "Missed check-in"
    case "checkin_today":
      return isAr ? "لم يسجل اليوم" : "No check-in today"
    case "media_pending":
      return isAr ? "ملفات للمراجعة" : "Media to review"
    case "goal_deadline":
      return isAr ? "موعد هدف قريب" : "Goal deadline"
  }
}
