import {
  PaymentStatus,
  PlanType,
  SubscriptionStatus,
} from "@/generated/prisma/enums"

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  NONE: "No Subscription",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  PAUSED: "Paused",
  TRIAL: "Trial",
}

export const PLAN_TYPE_BADGE_VARIANTS: Record<
  PlanType,
  "default" | "secondary" | "outline" | "destructive"
> = {
  SESSIONS: "secondary",
  PERIOD: "outline",
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAID: "Paid",
  PENDING: "Pending",
  FAILED: "Failed",
  NOT_REQUIRED: "Not Required",
}

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
  {
    value: PaymentStatus.NOT_REQUIRED,
    label: PAYMENT_STATUS_LABELS.NOT_REQUIRED,
  },
]

export const SUBSCRIPTION_STATUS_BADGE_VARIANTS: Record<
  SubscriptionStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  NONE: "outline",
  ACTIVE: "default",
  EXPIRED: "destructive",
  PAUSED: "secondary",
  TRIAL: "secondary",
}

export const PAYMENT_STATUS_BADGE_VARIANTS: Record<
  PaymentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PAID: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  NOT_REQUIRED: "outline",
}