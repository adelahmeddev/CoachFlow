"use client"

import { useState } from "react"
import { AlertTriangle, Clock, CreditCard, LogOut, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { CoachSubscriptionStatus } from "@/lib/db/enums"
import Link from "next/link"
import { signOut } from "next-auth/react"

interface Props {
  status: CoachSubscriptionStatus | null
  endDate: Date | null
  daysRemaining: number | null
}

export function SubscriptionExpiredView({ status, daysRemaining }: Props) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const isSuspended = status === "SUSPENDED"
  const isExpired = status === "EXPIRED"

  let title = "Subscription Required"
  let description = "Your Coach Flow subscription has expired. Renew your subscription to continue managing your clients."
  let icon = <AlertTriangle className="size-6 text-amber-600" />

  if (isSuspended) {
    title = "Account Suspended"
    description = "Your subscription has been suspended. Please contact support to restore access."
    icon = <AlertTriangle className="size-6 text-destructive" />
  } else if (isExpired) {
    title = "Subscription Expired"
    description = "Your subscription has expired. The admin will extend it after you pay outside the platform."
    icon = <Clock className="size-6 text-amber-600" />
  } else if (!status) {
    title = "No Active Subscription"
    description = "You don't have an active subscription yet. The admin will create it after payment."
  }

  async function handleSignOut() {
    setIsSigningOut(true)
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <div className="mx-auto max-w-2xl py-12">
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            {icon}
          </div>
          <CardTitle className="mt-4 text-xl">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Status:</span>
              <span className="font-medium capitalize">{status.toLowerCase()}</span>
            </div>
          )}
          {daysRemaining !== null && daysRemaining > 0 && (
            <Alert>
              <Clock className="size-4" />
              <AlertTitle>Trial ending soon</AlertTitle>
              <AlertDescription>{daysRemaining} days remaining in your trial.</AlertDescription>
            </Alert>
          )}
          <Alert>
            <CreditCard className="size-4" />
            <AlertTitle>Your data is safe</AlertTitle>
            <AlertDescription>
              All your clients and data are preserved. Nothing has been deleted. Renew to regain full access.
            </AlertDescription>
          </Alert>
          <div className="flex justify-center gap-3 pt-2">
            <Button asChild>
              <Link href="/subscription">View Subscription</Link>
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <Loader2 className="size-4 animate-spin me-1.5" />
              ) : (
                <LogOut className="size-4 me-1.5" />
              )}
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
