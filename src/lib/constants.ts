import type { VariantProps } from "class-variance-authority"
import { badgeVariants } from "@/components/ui/badge"
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
  CoachSubscriptionStatus,
} from "@/lib/db/enums"

export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

// ─── Labels ──────────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  COACH: "Coach",
  CLIENT: "Client",
}

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  INVITED: "Invited",
  PENDING_ASSESSMENT: "Pending Assessment",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
}

export const GOAL_LABELS: Record<Goal, string> = {
  WEIGHT_LOSS: "Weight Loss",
  MUSCLE_BUILDING: "Muscle Building",
  STRENGTH: "Strength & Performance",
  GENERAL_FITNESS: "General Fitness & Health",
  WEIGHT_GAIN: "Weight Gain",
  REHAB: "Rehab",
}

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
}

export const SPLIT_TYPE_LABELS: Record<SplitType, string> = {
  FULL_BODY: "Full Body",
  UPPER_LOWER: "Upper / Lower",
  PUSH_PULL_LEGS: "Push / Pull / Legs",
  BRO_SPLIT: "Bro Split",
  CUSTOM: "Custom",
}

export const DAY_FOCUS_LABELS: Record<TrainingDayFocus, string> = {
  REST: "Rest",
  UPPER: "Upper",
  LOWER: "Lower",
  FULL_BODY: "Full Body",
  PUSH: "Push",
  PULL: "Pull",
  LEGS: "Legs",
  SHOULDERS_ARMS: "Shoulders & Arms",
  CARDIO: "Cardio",
  MOBILITY: "Mobility",
  CUSTOM: "Custom",
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  NONE: "No Subscription",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  PAUSED: "Paused",
  TRIAL: "Trial",
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAID: "Paid",
  PENDING: "Pending",
  FAILED: "Failed",
  NOT_REQUIRED: "Not Required",
}

export const BODY_COMPOSITION_SOURCE_LABELS: Record<BodyCompositionSource, string> = {
  COACH: "Coach",
  CLIENT: "Client",
}

export const BODY_COMPOSITION_FIELD_LABELS: Record<string, string> = {
  weightKg: "الوزن (كجم) | WEIGHT (KG)",
  muscleMassKg: "الكتلة العضلية (كجم) | MUSCLE MASS (KG)",
  bodyFatKg: "كتلة الدهون (كجم) | BODY FAT (KG)",
  bodyWaterPct: "ماء الجسم (%) | BODY WATER (%)",
  fatControlKg: "التحكم في الدهون (كجم) | FAT CONTROL (KG)",
  bmrKcal: "معدل الأيض الأساسي (سعرة) | BMR (KCAL)",
  fitnessScore: "نقاط اللياقة | FITNESS SCORE",
  waistHipRatio: "نسبة الخصر للورك | WAIST-HIP RATIO",
  visceralFatLevel: "مستوى الدهون الحشوية | VISCERAL FAT LEVEL",
}

// ─── Options (label+value pairs for selects) ─────────────────────────────────

export const CLIENT_STATUS_OPTIONS = [
  { value: ClientStatus.INVITED, label: CLIENT_STATUS_LABELS.INVITED },
  { value: ClientStatus.PENDING_ASSESSMENT, label: CLIENT_STATUS_LABELS.PENDING_ASSESSMENT },
  { value: ClientStatus.ACTIVE, label: CLIENT_STATUS_LABELS.ACTIVE },
  { value: ClientStatus.PAUSED, label: CLIENT_STATUS_LABELS.PAUSED },
  { value: ClientStatus.COMPLETED, label: CLIENT_STATUS_LABELS.COMPLETED },
  { value: ClientStatus.ARCHIVED, label: CLIENT_STATUS_LABELS.ARCHIVED },
]

export const BODY_COMPOSITION_SOURCE_OPTIONS = [
  { value: BodyCompositionSource.COACH, label: BODY_COMPOSITION_SOURCE_LABELS.COACH },
  { value: BodyCompositionSource.CLIENT, label: BODY_COMPOSITION_SOURCE_LABELS.CLIENT },
]

export const PLAN_STATUS_OPTIONS = [
  { value: PlanStatus.DRAFT, label: PLAN_STATUS_LABELS.DRAFT },
  { value: PlanStatus.ACTIVE, label: PLAN_STATUS_LABELS.ACTIVE },
  { value: PlanStatus.PAUSED, label: PLAN_STATUS_LABELS.PAUSED },
  { value: PlanStatus.COMPLETED, label: PLAN_STATUS_LABELS.COMPLETED },
]

export const SPLIT_TYPE_OPTIONS = [
  { value: SplitType.FULL_BODY, label: SPLIT_TYPE_LABELS.FULL_BODY },
  { value: SplitType.UPPER_LOWER, label: SPLIT_TYPE_LABELS.UPPER_LOWER },
  { value: SplitType.PUSH_PULL_LEGS, label: SPLIT_TYPE_LABELS.PUSH_PULL_LEGS },
  { value: SplitType.BRO_SPLIT, label: SPLIT_TYPE_LABELS.BRO_SPLIT },
  { value: SplitType.CUSTOM, label: SPLIT_TYPE_LABELS.CUSTOM },
]

export const DAY_FOCUS_OPTIONS = [
  { value: TrainingDayFocus.REST, label: DAY_FOCUS_LABELS.REST },
  { value: TrainingDayFocus.UPPER, label: DAY_FOCUS_LABELS.UPPER },
  { value: TrainingDayFocus.LOWER, label: DAY_FOCUS_LABELS.LOWER },
  { value: TrainingDayFocus.FULL_BODY, label: DAY_FOCUS_LABELS.FULL_BODY },
  { value: TrainingDayFocus.PUSH, label: DAY_FOCUS_LABELS.PUSH },
  { value: TrainingDayFocus.PULL, label: DAY_FOCUS_LABELS.PULL },
  { value: TrainingDayFocus.LEGS, label: DAY_FOCUS_LABELS.LEGS },
  { value: TrainingDayFocus.SHOULDERS_ARMS, label: DAY_FOCUS_LABELS.SHOULDERS_ARMS },
  { value: TrainingDayFocus.CARDIO, label: DAY_FOCUS_LABELS.CARDIO },
  { value: TrainingDayFocus.MOBILITY, label: DAY_FOCUS_LABELS.MOBILITY },
  { value: TrainingDayFocus.CUSTOM, label: DAY_FOCUS_LABELS.CUSTOM },
]

export const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: SubscriptionStatus.NONE, label: SUBSCRIPTION_STATUS_LABELS.NONE },
  { value: SubscriptionStatus.ACTIVE, label: SUBSCRIPTION_STATUS_LABELS.ACTIVE },
  { value: SubscriptionStatus.TRIAL, label: SUBSCRIPTION_STATUS_LABELS.TRIAL },
  { value: SubscriptionStatus.PAUSED, label: SUBSCRIPTION_STATUS_LABELS.PAUSED },
  { value: SubscriptionStatus.EXPIRED, label: SUBSCRIPTION_STATUS_LABELS.EXPIRED },
]

export const PAYMENT_STATUS_OPTIONS = [
  { value: PaymentStatus.PAID, label: PAYMENT_STATUS_LABELS.PAID },
  { value: PaymentStatus.PENDING, label: PAYMENT_STATUS_LABELS.PENDING },
  { value: PaymentStatus.FAILED, label: PAYMENT_STATUS_LABELS.FAILED },
  { value: PaymentStatus.NOT_REQUIRED, label: PAYMENT_STATUS_LABELS.NOT_REQUIRED },
]

// ─── Badge variants ──────────────────────────────────────────────────────────

export const CLIENT_STATUS_BADGE_VARIANTS: Record<ClientStatus, BadgeVariant> = {
  INVITED: "secondary",
  PENDING_ASSESSMENT: "outline",
  ACTIVE: "default",
  PAUSED: "secondary",
  COMPLETED: "outline",
  ARCHIVED: "destructive",
}

export const SUBSCRIPTION_STATUS_BADGE_VARIANTS: Record<SubscriptionStatus, BadgeVariant> = {
  NONE: "outline",
  ACTIVE: "default",
  EXPIRED: "destructive",
  PAUSED: "secondary",
  TRIAL: "secondary",
}

export const PLAN_STATUS_BADGE_VARIANTS: Record<PlanStatus, BadgeVariant> = {
  ACTIVE: "default",
  DRAFT: "outline",
  PAUSED: "secondary",
  COMPLETED: "outline",
}

export const PLAN_TYPE_BADGE_VARIANTS: Record<PlanType, BadgeVariant> = {
  SESSIONS: "secondary",
  PERIOD: "outline",
}

export const PAYMENT_STATUS_BADGE_VARIANTS: Record<PaymentStatus, BadgeVariant> = {
  PAID: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  NOT_REQUIRED: "outline",
}

export const COACH_SUBSCRIPTION_STATUS_LABELS: Record<CoachSubscriptionStatus, string> = {
  ACTIVE: "Active",
  EXPIRED: "Expired",
  SUSPENDED: "Suspended",
}

export const COACH_SUBSCRIPTION_STATUS_BADGE_VARIANTS: Record<CoachSubscriptionStatus, BadgeVariant> = {
  ACTIVE: "default",
  EXPIRED: "destructive",
  SUSPENDED: "destructive",
}

// ─── Badge variant helpers ───────────────────────────────────────────────────

export function getClientStatusBadgeVariant(status: ClientStatus): BadgeVariant {
  return CLIENT_STATUS_BADGE_VARIANTS[status]
}

export function getPlanStatusBadgeVariant(status: PlanStatus): BadgeVariant {
  return PLAN_STATUS_BADGE_VARIANTS[status]
}

export function getSubscriptionStatusBadgeVariant(status: SubscriptionStatus): BadgeVariant {
  return SUBSCRIPTION_STATUS_BADGE_VARIANTS[status]
}

export function getGoalBadgeVariant(goal: Goal | null | undefined): BadgeVariant {
  switch (goal) {
    case "WEIGHT_LOSS":
    case "WEIGHT_GAIN":
      return "secondary"
    case "MUSCLE_BUILDING":
    case "STRENGTH":
      return "default"
    default:
      return "outline"
  }
}

// ─── Label helpers ───────────────────────────────────────────────────────────

export function getGoalLabel(goal: Goal | null | undefined): string | null {
  return goal ? GOAL_LABELS[goal] : null
}

export function getClientStatusLabel(status: ClientStatus): string {
  return CLIENT_STATUS_LABELS[status]
}

export function getPlanStatusLabel(status: PlanStatus): string {
  return PLAN_STATUS_LABELS[status]
}

export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  return SUBSCRIPTION_STATUS_LABELS[status]
}

export function getSplitTypeLabel(type: SplitType): string {
  return SPLIT_TYPE_LABELS[type]
}

// ─── Training split templates ────────────────────────────────────────────────

export interface SplitTypeTemplate {
  daysPerWeek: number
  days: TrainingDayFocus[]
}

export const SPLIT_TYPE_DEFAULT_TEMPLATES: Record<SplitType, SplitTypeTemplate> = {
  [SplitType.FULL_BODY]: {
    daysPerWeek: 3,
    days: [TrainingDayFocus.FULL_BODY, TrainingDayFocus.FULL_BODY, TrainingDayFocus.FULL_BODY],
  },
  [SplitType.UPPER_LOWER]: {
    daysPerWeek: 4,
    days: [TrainingDayFocus.UPPER, TrainingDayFocus.LOWER, TrainingDayFocus.UPPER, TrainingDayFocus.LOWER],
  },
  [SplitType.PUSH_PULL_LEGS]: {
    daysPerWeek: 6,
    days: [
      TrainingDayFocus.PUSH, TrainingDayFocus.PULL, TrainingDayFocus.LEGS,
      TrainingDayFocus.PUSH, TrainingDayFocus.PULL, TrainingDayFocus.LEGS,
    ],
  },
  [SplitType.BRO_SPLIT]: {
    daysPerWeek: 5,
    days: [
      TrainingDayFocus.PUSH, TrainingDayFocus.PULL, TrainingDayFocus.LEGS,
      TrainingDayFocus.SHOULDERS_ARMS, TrainingDayFocus.UPPER,
    ],
  },
  [SplitType.CUSTOM]: {
    daysPerWeek: 3,
    days: [TrainingDayFocus.CUSTOM, TrainingDayFocus.CUSTOM, TrainingDayFocus.CUSTOM],
  },
}

export const MAX_TRAINING_DAYS = 7
export const MIN_TRAINING_DAYS = 1
