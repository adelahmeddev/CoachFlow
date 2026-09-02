"use client"

import {
  LayoutDashboard,
  Settings,
  UserPlus,
  Users,
  CreditCard,
  UserCog,
  ShieldCheck,
  Dumbbell,
  Apple,
  UserRound,
  CalendarDays,
  MessageCircle,
  Crown,
  Flame,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type NavItem = {
  titleKey: string
  href: string
  icon: LucideIcon
}

export const TRAINER_NAV_ITEMS: NavItem[] = [
  { titleKey: "nav.dashboard", href: "/dashboard", icon: Flame },
  { titleKey: "nav.clients", href: "/clients", icon: Users },
  { titleKey: "nav.onboarding", href: "/onboarding", icon: UserPlus },
  {
    titleKey: "nav.trainingSplitTemplates",
    href: "/training-split-templates",
    icon: Dumbbell,
  },
  {
    titleKey: "nav.nutritionTemplates",
    href: "/nutrition-templates",
    icon: Apple,
  },
  {
    titleKey: "nav.subscriptionPlans",
    href: "/subscription-plans",
    icon: Crown,
  },
  { titleKey: "nav.messages", href: "/messages", icon: MessageCircle },
  { titleKey: "nav.settings", href: "/settings", icon: Settings },
  { titleKey: "subscription.title", href: "/subscription", icon: CreditCard },
]

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    titleKey: "admin.nav.dashboard",
    href: "/admin",
    icon: ShieldCheck,
  },
  { titleKey: "admin.nav.trainers", href: "/admin/trainers", icon: UserCog },
  { titleKey: "admin.nav.clients", href: "/admin/clients", icon: Users },
  {
    titleKey: "admin.nav.subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
]

export const CLIENT_NAV_ITEMS: NavItem[] = [
  {
    titleKey: "client.home.greeting",
    href: "/client/home",
    icon: LayoutDashboard,
  },
  {
    titleKey: "client.week.myWeek",
    href: "/client/week",
    icon: CalendarDays,
  },
  {
    titleKey: "client.workout.startWorkout",
    href: "/client/workout/today",
    icon: Dumbbell,
  },
  {
    titleKey: "client.nutrition.myPlan",
    href: "/client/nutrition",
    icon: Apple,
  },
  {
    titleKey: "nav.messages",
    href: "/client/messages",
    icon: MessageCircle,
  },
  {
    titleKey: "client.profile.myInfo",
    href: "/client/profile",
    icon: UserRound,
  },
]