import {
  BodyCompositionSource,
  ClientStatus,
  Goal,
  PaymentStatus,
  PlanStatus,
  Role,
  SplitType,
  SubscriptionStatus,
  TrainingDayFocus,
} from "@/generated/prisma/enums"

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  TRAINER: "Trainer",
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
  NONE: "None",
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

export const CLIENT_STATUS_OPTIONS = [
  { value: ClientStatus.INVITED, label: CLIENT_STATUS_LABELS.INVITED },
  {
    value: ClientStatus.PENDING_ASSESSMENT,
    label: CLIENT_STATUS_LABELS.PENDING_ASSESSMENT,
  },
  { value: ClientStatus.ACTIVE, label: CLIENT_STATUS_LABELS.ACTIVE },
  { value: ClientStatus.PAUSED, label: CLIENT_STATUS_LABELS.PAUSED },
  { value: ClientStatus.COMPLETED, label: CLIENT_STATUS_LABELS.COMPLETED },
  { value: ClientStatus.ARCHIVED, label: CLIENT_STATUS_LABELS.ARCHIVED },
]

export const GOAL_OPTIONS = [
  { value: Goal.WEIGHT_LOSS, label: GOAL_LABELS.WEIGHT_LOSS },
  { value: Goal.MUSCLE_BUILDING, label: GOAL_LABELS.MUSCLE_BUILDING },
  { value: Goal.STRENGTH, label: GOAL_LABELS.STRENGTH },
  { value: Goal.GENERAL_FITNESS, label: GOAL_LABELS.GENERAL_FITNESS },
  { value: Goal.WEIGHT_GAIN, label: GOAL_LABELS.WEIGHT_GAIN },
]

export const BODY_COMPOSITION_SOURCE_LABELS: Record<BodyCompositionSource, string> = {
  COACH: "Coach",
  CLIENT: "Client",
}

export const BODY_COMPOSITION_SOURCE_OPTIONS = [
  { value: BodyCompositionSource.COACH, label: BODY_COMPOSITION_SOURCE_LABELS.COACH },
  { value: BodyCompositionSource.CLIENT, label: BODY_COMPOSITION_SOURCE_LABELS.CLIENT },
]

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

export const PLAN_STATUS_OPTIONS = [
  { value: PlanStatus.DRAFT, label: PLAN_STATUS_LABELS.DRAFT },
  { value: PlanStatus.ACTIVE, label: PLAN_STATUS_LABELS.ACTIVE },
  { value: PlanStatus.PAUSED, label: PLAN_STATUS_LABELS.PAUSED },
  { value: PlanStatus.COMPLETED, label: PLAN_STATUS_LABELS.COMPLETED },
]

export const SPLIT_TYPE_OPTIONS = [
  { value: SplitType.FULL_BODY, label: SPLIT_TYPE_LABELS.FULL_BODY },
  { value: SplitType.UPPER_LOWER, label: SPLIT_TYPE_LABELS.UPPER_LOWER },
  {
    value: SplitType.PUSH_PULL_LEGS,
    label: SPLIT_TYPE_LABELS.PUSH_PULL_LEGS,
  },
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
  {
    value: TrainingDayFocus.SHOULDERS_ARMS,
    label: DAY_FOCUS_LABELS.SHOULDERS_ARMS,
  },
  { value: TrainingDayFocus.CARDIO, label: DAY_FOCUS_LABELS.CARDIO },
  { value: TrainingDayFocus.MOBILITY, label: DAY_FOCUS_LABELS.MOBILITY },
  { value: TrainingDayFocus.CUSTOM, label: DAY_FOCUS_LABELS.CUSTOM },
]

export const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: SubscriptionStatus.NONE, label: SUBSCRIPTION_STATUS_LABELS.NONE },
  {
    value: SubscriptionStatus.ACTIVE,
    label: SUBSCRIPTION_STATUS_LABELS.ACTIVE,
  },
  {
    value: SubscriptionStatus.EXPIRED,
    label: SUBSCRIPTION_STATUS_LABELS.EXPIRED,
  },
  {
    value: SubscriptionStatus.PAUSED,
    label: SUBSCRIPTION_STATUS_LABELS.PAUSED,
  },
  { value: SubscriptionStatus.TRIAL, label: SUBSCRIPTION_STATUS_LABELS.TRIAL },
]

export const PAYMENT_STATUS_OPTIONS = [
  { value: PaymentStatus.PAID, label: PAYMENT_STATUS_LABELS.PAID },
  { value: PaymentStatus.PENDING, label: PAYMENT_STATUS_LABELS.PENDING },
  { value: PaymentStatus.FAILED, label: PAYMENT_STATUS_LABELS.FAILED },
  {
    value: PaymentStatus.NOT_REQUIRED,
    label: PAYMENT_STATUS_LABELS.NOT_REQUIRED,
  },
]

export const CLIENT_STATUS_BADGE_VARIANTS: Record<
  ClientStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  INVITED: "secondary",
  PENDING_ASSESSMENT: "outline",
  ACTIVE: "default",
  PAUSED: "secondary",
  COMPLETED: "outline",
  ARCHIVED: "outline",
}

export const SUBSCRIPTION_STATUS_BADGE_VARIANTS: Record<
  SubscriptionStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  NONE: "outline",
  ACTIVE: "default",
  EXPIRED: "destructive",
  PAUSED: "secondary",
  TRIAL: "outline",
}

export const GOAL_OPTIONS_PUBLIC = [
  { value: Goal.WEIGHT_LOSS, label: GOAL_LABELS.WEIGHT_LOSS },
  { value: Goal.MUSCLE_BUILDING, label: GOAL_LABELS.MUSCLE_BUILDING },
  { value: Goal.STRENGTH, label: GOAL_LABELS.STRENGTH },
  { value: Goal.GENERAL_FITNESS, label: GOAL_LABELS.GENERAL_FITNESS },
  { value: Goal.WEIGHT_GAIN, label: GOAL_LABELS.WEIGHT_GAIN },
]
