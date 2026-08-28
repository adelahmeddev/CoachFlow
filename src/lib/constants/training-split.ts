import { SplitType, TrainingDayFocus } from "@/generated/prisma/enums"

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

export interface SplitTypeTemplate {
  daysPerWeek: number
  days: TrainingDayFocus[]
}

export const SPLIT_TYPE_DEFAULT_TEMPLATES: Record<
  SplitType,
  SplitTypeTemplate
> = {
  [SplitType.FULL_BODY]: {
    daysPerWeek: 3,
    days: [
      TrainingDayFocus.FULL_BODY,
      TrainingDayFocus.FULL_BODY,
      TrainingDayFocus.FULL_BODY,
    ],
  },
  [SplitType.UPPER_LOWER]: {
    daysPerWeek: 4,
    days: [
      TrainingDayFocus.UPPER,
      TrainingDayFocus.LOWER,
      TrainingDayFocus.UPPER,
      TrainingDayFocus.LOWER,
    ],
  },
  [SplitType.PUSH_PULL_LEGS]: {
    daysPerWeek: 6,
    days: [
      TrainingDayFocus.PUSH,
      TrainingDayFocus.PULL,
      TrainingDayFocus.LEGS,
      TrainingDayFocus.PUSH,
      TrainingDayFocus.PULL,
      TrainingDayFocus.LEGS,
    ],
  },
  [SplitType.BRO_SPLIT]: {
    daysPerWeek: 5,
    days: [
      TrainingDayFocus.PUSH,
      TrainingDayFocus.PULL,
      TrainingDayFocus.LEGS,
      TrainingDayFocus.SHOULDERS_ARMS,
      TrainingDayFocus.UPPER,
    ],
  },
  [SplitType.CUSTOM]: {
    daysPerWeek: 3,
    days: [
      TrainingDayFocus.CUSTOM,
      TrainingDayFocus.CUSTOM,
      TrainingDayFocus.CUSTOM,
    ],
  },
}

export const MAX_TRAINING_DAYS = 7
export const MIN_TRAINING_DAYS = 1