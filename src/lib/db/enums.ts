export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COACH: 'COACH',
  CLIENT: 'CLIENT',
} as const
export type Role = (typeof Role)[keyof typeof Role]

export const ClientStatus = {
  INVITED: 'INVITED',
  PENDING_ASSESSMENT: 'PENDING_ASSESSMENT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const
export type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus]

export const Goal = {
  WEIGHT_LOSS: 'WEIGHT_LOSS',
  MUSCLE_BUILDING: 'MUSCLE_BUILDING',
  STRENGTH: 'STRENGTH',
  GENERAL_FITNESS: 'GENERAL_FITNESS',
  WEIGHT_GAIN: 'WEIGHT_GAIN',
  REHAB: 'REHAB',
} as const
export type Goal = (typeof Goal)[keyof typeof Goal]

export const PlanStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
} as const
export type PlanStatus = (typeof PlanStatus)[keyof typeof PlanStatus]

export const SplitType = {
  FULL_BODY: 'FULL_BODY',
  UPPER_LOWER: 'UPPER_LOWER',
  PUSH_PULL_LEGS: 'PUSH_PULL_LEGS',
  BRO_SPLIT: 'BRO_SPLIT',
  CUSTOM: 'CUSTOM',
} as const
export type SplitType = (typeof SplitType)[keyof typeof SplitType]

export const TrainingDayFocus = {
  REST: 'REST',
  UPPER: 'UPPER',
  LOWER: 'LOWER',
  FULL_BODY: 'FULL_BODY',
  PUSH: 'PUSH',
  PULL: 'PULL',
  LEGS: 'LEGS',
  SHOULDERS_ARMS: 'SHOULDERS_ARMS',
  CARDIO: 'CARDIO',
  MOBILITY: 'MOBILITY',
  CUSTOM: 'CUSTOM',
} as const
export type TrainingDayFocus = (typeof TrainingDayFocus)[keyof typeof TrainingDayFocus]

export const SubscriptionStatus = {
  NONE: 'NONE',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  PAUSED: 'PAUSED',
  TRIAL: 'TRIAL',
} as const
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]

export const PlanType = {
  SESSIONS: 'SESSIONS',
  PERIOD: 'PERIOD',
} as const
export type PlanType = (typeof PlanType)[keyof typeof PlanType]

export const PaymentStatus = {
  PAID: 'PAID',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  NOT_REQUIRED: 'NOT_REQUIRED',
} as const
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export const PaymentProofStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const
export type PaymentProofStatus = (typeof PaymentProofStatus)[keyof typeof PaymentProofStatus]

export const NotificationType = {
  WORKOUT_REMINDER: 'WORKOUT_REMINDER',
  CHECKIN_REMINDER: 'CHECKIN_REMINDER',
  NEW_MESSAGE: 'NEW_MESSAGE',
  PLAN_UPDATED: 'PLAN_UPDATED',
  SUBSCRIPTION_STATUS: 'SUBSCRIPTION_STATUS',
  COACH_FEEDBACK: 'COACH_FEEDBACK',
  PROGRESS_REMINDER: 'PROGRESS_REMINDER',
  CLIENT_INACTIVE: 'CLIENT_INACTIVE',
  SUBSCRIPTION_EXPIRING: 'SUBSCRIPTION_EXPIRING',
  PAYMENT_PROOF_PENDING: 'PAYMENT_PROOF_PENDING',
  CLIENT_ACTIVITY: 'CLIENT_ACTIVITY',
  PROGRESS_UPDATE: 'PROGRESS_UPDATE',
  MEDIA_SUBMITTED: 'MEDIA_SUBMITTED',
  CHECKIN_ACTIVITY: 'CHECKIN_ACTIVITY',
} as const
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

export const ProgressMediaType = {
  PROGRESS_PHOTO: 'PROGRESS_PHOTO',
  FORM_VIDEO: 'FORM_VIDEO',
  OTHER: 'OTHER',
} as const
export type ProgressMediaType = (typeof ProgressMediaType)[keyof typeof ProgressMediaType]

export const ProgressMediaStatus = {
  PENDING: 'PENDING',
  REVIEWED: 'REVIEWED',
} as const
export type ProgressMediaStatus = (typeof ProgressMediaStatus)[keyof typeof ProgressMediaStatus]

export const GoalType = {
  WEIGHT: 'WEIGHT',
  BODY_FAT: 'BODY_FAT',
  MUSCLE: 'MUSCLE',
  MEASUREMENT: 'MEASUREMENT',
  STRENGTH: 'STRENGTH',
  CUSTOM: 'CUSTOM',
} as const
export type GoalType = (typeof GoalType)[keyof typeof GoalType]

export const GoalStatus = {
  ACTIVE: 'ACTIVE',
  ACHIEVED: 'ACHIEVED',
  PAUSED: 'PAUSED',
  CANCELLED: 'CANCELLED',
} as const
export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus]

export const Units = {
  METRIC: 'METRIC',
  IMPERIAL: 'IMPERIAL',
} as const
export type Units = (typeof Units)[keyof typeof Units]

export const WeekStartDay = {
  SAT: 'SAT',
  SUN: 'SUN',
  MON: 'MON',
} as const
export type WeekStartDay = (typeof WeekStartDay)[keyof typeof WeekStartDay]

export const Weekday = {
  SAT: 'SAT',
  SUN: 'SUN',
  MON: 'MON',
  TUE: 'TUE',
  WED: 'WED',
  THU: 'THU',
  FRI: 'FRI',
} as const
export type Weekday = (typeof Weekday)[keyof typeof Weekday]

export const ScheduleMode = {
  FIXED_WEEKDAYS: 'FIXED_WEEKDAYS',
  SEQUENTIAL: 'SEQUENTIAL',
} as const
export type ScheduleMode = (typeof ScheduleMode)[keyof typeof ScheduleMode]

export const BodyCompositionSource = {
  COACH: 'COACH',
  CLIENT: 'CLIENT',
} as const
export type BodyCompositionSource = (typeof BodyCompositionSource)[keyof typeof BodyCompositionSource]

export const SubstituteCategory = {
  CARB: 'CARB',
  PROTEIN: 'PROTEIN',
  FAT: 'FAT',
  FRUIT: 'FRUIT',
} as const
export type SubstituteCategory = (typeof SubstituteCategory)[keyof typeof SubstituteCategory]

export const QuantityUnit = {
  G: 'G',
  ML: 'ML',
  PCS: 'PCS',
} as const
export type QuantityUnit = (typeof QuantityUnit)[keyof typeof QuantityUnit]

export const MealKind = {
  MEAL: 'MEAL',
  SNACK: 'SNACK',
} as const
export type MealKind = (typeof MealKind)[keyof typeof MealKind]

export const PostCategory = {
  TRANSFORMATION: 'TRANSFORMATION',
  TRAINING: 'TRAINING',
  NUTRITION: 'NUTRITION',
  TIPS: 'TIPS',
  EDUCATION: 'EDUCATION',
  GENERAL: 'GENERAL',
} as const
export type PostCategory = (typeof PostCategory)[keyof typeof PostCategory]

export const CoachingMode = {
  ONLINE: 'ONLINE',
  IN_PERSON: 'IN_PERSON',
} as const
export type CoachingMode = (typeof CoachingMode)[keyof typeof CoachingMode]

export const WorkoutDisplayMode = {
  FULL: 'FULL',
  DAY_NAME_ONLY: 'DAY_NAME_ONLY',
} as const
export type WorkoutDisplayMode = (typeof WorkoutDisplayMode)[keyof typeof WorkoutDisplayMode]

export const TrainerAccountStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const
export type TrainerAccountStatus = (typeof TrainerAccountStatus)[keyof typeof TrainerAccountStatus]

export const CoachSubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  SUSPENDED: 'SUSPENDED',
} as const
export type CoachSubscriptionStatus = (typeof CoachSubscriptionStatus)[keyof typeof CoachSubscriptionStatus]
