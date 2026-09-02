import type {
  Role,
  ClientStatus,
  Goal,
  PlanStatus,
  SplitType,
  TrainingDayFocus,
  SubscriptionStatus,
  PlanType,
  PaymentStatus,
  Units,
  WeekStartDay,
  Weekday,
  ScheduleMode,
  BodyCompositionSource,
  SubstituteCategory,
  QuantityUnit,
  MealKind,
  TrainerAccountStatus,
  CoachSubscriptionStatus,
} from "./enums"

export type User = {
  id: string
  username: string | null
  phone: string | null
  email: string | null
  passwordHash: string
  role: Role
  mustChangePassword: boolean
  createdAt: Date
  updatedAt: Date
}

export type TrainerProfile = {
  id: string
  userId: string
  fullName: string
  phone: string
  createdAt: Date
  updatedAt: Date
  email: string | null
  businessName: string | null
  units: Units
  weekStartDay: WeekStartDay
  timezone: string | null
  accountStatus: TrainerAccountStatus
  notifyReassessment: boolean
  notifyInactivity: boolean
  notifySubscription: boolean
  weeklySummary: boolean
  inviteSlug: string | null
  inviteSlugCreatedAt: Date | null
  previousInviteSlug: string | null
  previousInviteSlugExpiresAt: Date | null
}

export type Client = {
  id: string
  trainerId: string
  userId: string | null
  fullName: string | null
  birthDate: Date | null
  phone: string | null
  goal: Goal | null
  status: ClientStatus
  inviteToken: string | null
  inviteExpiresAt: Date | null
  basicInfoCompletedAt: Date | null
  passwordHash: string | null
  email: string | null
  neckPain: boolean
  shoulderPain: boolean
  backPain: boolean
  kneePain: boolean
  createdAt: Date
  updatedAt: Date
}

export type NutritionTemplate = {
  id: string
  trainerId: string | null
  name: string
  isGlobal: boolean
  calories: number | null
  proteinGrams: number | null
  carbsGrams: number | null
  fatsGrams: number | null
  waterLiters: number | null
  coachMessage: string | null
  guidelines: string[]
  avoidFoods: string[]
  recommendedFoods: string[]
  createdAt: Date
  updatedAt: Date
}

export type SupplementDef = {
  id: string
  templateId: string | null
  planId: string | null
  name: string
  nameAr: string | null
  definition: string | null
  definitionAr: string | null
  importance: string | null
  importanceAr: string | null
  order: number
}

export type SubstituteGroup = {
  id: string
  templateId: string | null
  planId: string | null
  category: SubstituteCategory
  caloriesLabel: string | null
  order: number
}

export type SubstituteItem = {
  id: string
  groupId: string
  group: SubstituteGroup
  name: string
  nameAr: string | null
  amount: number | null
  unit: QuantityUnit
  order: number
  // flattened for pg
  groupIdRaw?: string
}

export type ClientNutritionPlan = {
  id: string
  clientId: string
  templateId: string | null
  calories: number | null
  proteinGrams: number | null
  carbsGrams: number | null
  fatsGrams: number | null
  waterLiters: number | null
  coachMessage: string | null
  guidelines: string[]
  avoidFoods: string[]
  recommendedFoods: string[]
  status: PlanStatus
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export type TrainingSplit = {
  id: string
  clientId: string
  splitType: SplitType
  daysPerWeek: number
  scheduleMode: ScheduleMode
  notes: string | null
  status: PlanStatus
  createdAt: Date
  updatedAt: Date
}

export type TrainingSplitDay = {
  id: string
  splitId: string
  dayNumber: number
  focus: TrainingDayFocus
  customFocus: string | null
  weekday: Weekday | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type Subscription = {
  id: string
  clientId: string
  planId: string | null
  planName: string
  planType: PlanType
  status: SubscriptionStatus
  startDate: Date | null
  endDate: Date | null
  durationDays: number | null
  sessionsCount: number | null
  remainingSessions: number | null
  paymentStatus: PaymentStatus
  autoRenew: boolean
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type SubscriptionPlan = {
  id: string
  trainerId: string
  name: string
  planType: PlanType
  sessionsCount: number | null
  durationDays: number | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type ProgressReview = {
  id: string
  clientId: string
  reviewDate: Date
  trainerNotes: string | null
  adherencePct: number | null
  energyLevel: number | null
  nextAssessmentDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export type WorkoutLog = {
  id: string
  clientId: string
  date: Date
  exerciseName: string
  sets: number | null
  reps: number | null
  weightKg: number | null
  rpe: number | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type Exercise = {
  id: string
  name: string
  nameAr: string | null
  muscleGroup: string
  equipment: string | null
  tags: string[]
  defaultSets: number | null
  defaultReps: number | null
  defaultRestSeconds: number | null
  isGlobal: boolean
  youtubeUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export type TrainingSplitTemplate = {
  id: string
  trainerId: string | null
  name: string
  goal: Goal | null
  level: string | null
  splitType: SplitType
  daysPerWeek: number
  description: string | null
  isGlobal: boolean
  createdAt: Date
  updatedAt: Date
}

export type TrainingSplitTemplateDay = {
  id: string
  templateId: string
  dayNumber: number
  focus: TrainingDayFocus
  customFocus: string | null
  createdAt: Date
  updatedAt: Date
}

export type TemplateDayExercise = {
  id: string
  templateDayId: string
  order: number
  exerciseId: string | null
  exerciseName: string
  targetSets: number | null
  targetReps: number | null
  targetWeightKg: number | null
  restSeconds: number | null
  notes: string | null
  videoUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export type SplitDayExercise = {
  id: string
  splitDayId: string
  order: number
  exerciseId: string | null
  exerciseName: string
  targetSets: number | null
  targetReps: number | null
  restSeconds: number | null
  targetWeightKg: number | null
  notes: string | null
  videoUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export type ExerciseLog = {
  id: string
  splitDayExerciseId: string
  clientId: string
  date: Date
  actualSets: number | null
  actualReps: number | null
  actualWeightKg: number | null
  rpe: number | null
  notes: string | null
  setData: unknown | null
  createdAt: Date
  updatedAt: Date
}

export type DailyLog = {
  id: string
  clientId: string
  date: Date
  weightKg: number | null
  sleepHours: number | null
  waterLiters: number | null
  energyLevel: number | null
  moodLevel: number | null
  nutritionCompliant: boolean | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type Meal = {
  id: string
  templateId: string | null
  planId: string | null
  kind: MealKind
  order: number
  name: string
  nameAr: string | null
}

export type MealItem = {
  id: string
  mealId: string
  groupNumber: number
  foodName: string
  foodNameAr: string | null
  amount: number | null
  unit: QuantityUnit
  calories: number | null
  order: number
}

export type MealChoice = {
  id: string
  clientId: string
  mealItemId: string
  date: Date
  createdAt: Date
}

export type BodyComposition = {
  id: string
  clientId: string
  date: Date
  source: BodyCompositionSource
  weightKg: number | null
  muscleMassKg: number | null
  bodyFatKg: number | null
  bodyWaterPct: number | null
  fatControlKg: number | null
  bmrKcal: number | null
  fitnessScore: number | null
  waistHipRatio: number | null
  visceralFatLevel: number | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type WeeklyCheckIn = {
  id: string
  clientId: string
  date: Date
  weightKg: number | null
  photoUrl: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type Conversation = {
  id: string
  trainerId: string
  clientId: string
  lastMessageAt: Date | null
  lastMessagePreview: string | null
  createdAt: Date
  updatedAt: Date
}

export type Message = {
  id: string
  conversationId: string
  conversation: Conversation
  senderId: string
  senderRole: Role
  body: string
  readAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type CoachSubscription = {
  id: string
  coachId: string
  startDate: Date
  endDate: Date
  amountPaid: number
  paymentDate: Date
  status: CoachSubscriptionStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type PaymentRecord = {
  id: string
  coachId: string
  subscriptionId: string
  amount: number
  paymentDate: Date
  notes: string | null
  createdAt: Date
}

export type CoachBranding = {
  id: string
  coachId: string
  brandName: string | null
  logoUrl: string | null
  primaryColor: string | null
  createdAt: Date
  updatedAt: Date
}
