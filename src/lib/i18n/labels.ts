import { en, type Dictionary } from "./messages/en"
import { ar } from "./messages/ar"
import type { Locale } from "./config"
import { interpolate } from "./format"
import {
  BodyCompositionSource,
  ClientStatus,
  Goal,
  PaymentStatus,
  PlanStatus,
  PlanType,
  Role,
  SplitType,
  SubscriptionStatus,
  TrainingDayFocus,
} from "@/lib/db/enums"

const dictionaries: Record<Locale, Dictionary> = { en, ar }

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}

function enumKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase())
}

function enumKeySnake(value: string): string {
  return value.toLowerCase()
}

// Tries snake first (goals, clientStatus), then camel fallback
function lookupEnum<T extends Record<string, string>>(dict: T, value: string): string | undefined {
  const snake = enumKeySnake(value) as keyof T
  if (snake in dict) return dict[snake]
  const camel = enumKey(value) as keyof T
  return dict[camel]
}

export function getRoleLabel(role: Role, locale: Locale): string {
  return getDictionary(locale).enums.role[role.toLowerCase() as keyof typeof en.enums.role]
}

export function getGoalLabel(goal: Goal | null | undefined, locale: Locale): string | null {
  if (!goal) return null
  const dict = getDictionary(locale).enums.goals as Record<string, string>
  return lookupEnum(dict, goal) ?? goal
}

export function getClientStatusLabel(status: ClientStatus, locale: Locale): string {
  const dict = getDictionary(locale).enums.clientStatus as Record<string, string>
  return lookupEnum(dict, status) ?? status
}

export function getSubscriptionStatusLabel(
  status: SubscriptionStatus,
  locale: Locale
): string {
  const dict = getDictionary(locale).subscription.statuses as Record<string, string>
  return lookupEnum(dict, status) ?? status
}

export function getPaymentStatusLabel(
  status: PaymentStatus,
  locale: Locale
): string {
  const dict = getDictionary(locale).subscription.payments as Record<string, string>
  return lookupEnum(dict, status) ?? status
}

export function getPlanTypeLabel(type: PlanType, locale: Locale): string {
  const dict = getDictionary(locale).subscription.planTypes as Record<string, string>
  return lookupEnum(dict, type) ?? type
}

type PlanSizeSubscription = {
  planType: PlanType
  sessionsCount?: number | null
  durationDays?: number | null
}

export function formatPlanSize(
  subscription: PlanSizeSubscription,
  locale: Locale
): string {
  const dict = getDictionary(locale).subscription
  if (subscription.planType === PlanType.SESSIONS) {
    if (subscription.sessionsCount == null) return "—"
    return interpolate(dict.summarySessions, { total: subscription.sessionsCount })
  }
  if (subscription.durationDays == null) return "—"
  return interpolate(dict.summaryPeriodDays, { total: subscription.durationDays })
}

export function getPlanStatusLabel(status: PlanStatus, locale: Locale): string {
  const dict = getDictionary(locale).enums.planStatus as Record<string, string>
  return lookupEnum(dict, status) ?? status
}

export function getSplitTypeLabel(type: SplitType, locale: Locale): string {
  const dict = getDictionary(locale).trainingSplit.splitTypes as Record<string, string>
  return lookupEnum(dict, type) ?? type
}

export function getDayFocusLabel(focus: TrainingDayFocus, locale: Locale): string {
  const dict = getDictionary(locale).trainingSplit.dayFocus as Record<string, string>
  return lookupEnum(dict, focus) ?? focus
}

export function getBodyCompositionSourceLabel(
  source: BodyCompositionSource,
  locale: Locale
): string {
  const dict = getDictionary(locale).bodyComposition.sources as Record<string, string>
  return lookupEnum(dict, source) ?? source
}

export function getBodyCompositionFieldLabel(
  field: string,
  locale: Locale
): string {
  const dict = getDictionary(locale).bodyComposition.fields as Record<string, string>
  return dict[field] ?? field
}

export function getExerciseName(
  exercise: { name: string; nameAr?: string | null },
  locale: Locale
): string {
  if (!exercise.nameAr) return exercise.name
  if (locale === "ar") return exercise.nameAr
  return exercise.name
}

export function getMuscleGroupLabel(
  muscleGroup: string,
  locale: Locale
): string {
  return (
    getDictionary(locale).templates.muscleGroups[
      muscleGroup.toLowerCase() as keyof typeof en.templates.muscleGroups
    ] ?? muscleGroup
  )
}

export function getEquipmentLabel(
  equipment: string | null,
  locale: Locale
): string {
  if (!equipment) return ""
  return (
    getDictionary(locale).templates.equipment[
      equipment.toLowerCase() as keyof typeof en.templates.equipment
    ] ?? equipment
  )
}