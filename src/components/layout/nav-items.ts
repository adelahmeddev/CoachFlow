"use client"

import {
  LayoutDashboard,
  Settings,
  UserPlus,
  Users,
  UtensilsCrossed,
  CreditCard,
  UserCog,
  ShieldCheck,
  CalendarRange,
  Dumbbell,
  BarChart3,
  Apple,
  UserRound,
  CalendarDays,
  MessageCircle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type NavItem = {
  titleKey: string
  href: string
  icon: LucideIcon
}

export const TRAINER_NAV_ITEMS: NavItem[] = [
  { titleKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { titleKey: "nav.clients", href: "/clients", icon: Users },
  { titleKey: "nav.onboarding", href: "/onboarding", icon: UserPlus },
  {
    titleKey: "nav.trainingSplitTemplates",
    href: "/training-split-templates",
    icon: CalendarRange,
  },
  {
    titleKey: "nav.nutritionTemplates",
    href: "/nutrition-templates",
    icon: UtensilsCrossed,
  },
  {
    titleKey: "nav.subscriptionPlans",
    href: "/subscription-plans",
    icon: CreditCard,
  },
  { titleKey: "nav.messages", href: "/messages", icon: MessageCircle },
  { titleKey: "nav.settings", href: "/settings", icon: Settings },
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
    titleKey: "client.progress.title",
    href: "/client/progress",
    icon: BarChart3,
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