import type { VariantProps } from "class-variance-authority"
import { badgeVariants } from "@/components/ui/badge"
import type {
  ClientStatus,
  Goal,
  PlanStatus,
  SplitType,
  SubscriptionStatus,
} from "@/generated/prisma/enums"

export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

const GOAL_LABELS: Record<Goal, string> = {
  WEIGHT_LOSS: "Weight Loss",
  MUSCLE_BUILDING: "Muscle Building",
  STRENGTH: "Strength & Performance",
  GENERAL_FITNESS: "General Fitness & Health",
  WEIGHT_GAIN: "Weight Gain",
  REHAB: "Rehab",
}

const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  INVITED: "Invited",
  PENDING_ASSESSMENT: "Pending Assessment",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
}

const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
}

const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  NONE: "None",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  PAUSED: "Paused",
  TRIAL: "Trial",
}

const SPLIT_TYPE_LABELS: Record<SplitType, string> = {
  FULL_BODY: "Full Body",
  UPPER_LOWER: "Upper / Lower",
  PUSH_PULL_LEGS: "Push / Pull / Legs",
  BRO_SPLIT: "Bro Split",
  CUSTOM: "Custom",
}

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

export function getClientStatusBadgeVariant(status: ClientStatus): BadgeVariant {
  switch (status) {
    case "ACTIVE":
      return "default"
    case "PAUSED":
    case "PENDING_ASSESSMENT":
      return "secondary"
    case "INVITED":
      return "outline"
    case "COMPLETED":
      return "outline"
    case "ARCHIVED":
      return "destructive"
  }
}

export function getPlanStatusBadgeVariant(status: PlanStatus): BadgeVariant {
  switch (status) {
    case "ACTIVE":
      return "default"
    case "DRAFT":
      return "outline"
    case "PAUSED":
      return "secondary"
    case "COMPLETED":
      return "outline"
  }
}

export function getSubscriptionStatusBadgeVariant(status: SubscriptionStatus): BadgeVariant {
  switch (status) {
    case "ACTIVE":
    case "TRIAL":
      return "default"
    case "PAUSED":
      return "secondary"
    case "EXPIRED":
    case "NONE":
      return "destructive"
  }
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
