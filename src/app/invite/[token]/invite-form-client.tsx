"use client"

import { CircleCheck, CircleX, Hourglass } from "lucide-react"
import { submitClientBasicInfoAction, submitClientAccountInfoAction } from "@/server/actions/invite"
import { ClientBasicInfoForm } from "@/components/features/invite/client-basic-info-form"
import { InviteAccountForm } from "@/components/features/invite/invite-account-form"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"
import { BrandLogo } from "@/components/brand/brand-logo"
import type { PublicInviteResult } from "@/server/services/invite.service"

interface InviteFormClientProps {
  result: PublicInviteResult
  token: string
}

export function InviteFormClient({ result, token }: InviteFormClientProps) {
  const { t } = useI18n()

  if (!result.valid) {
    const content =
      result.reason === "expired" ? (
        <Alert variant="destructive">
          <Hourglass className="size-4" />
          <AlertTitle>{t.invite.expiredTitle}</AlertTitle>
          <AlertDescription>
            {t.invite.expiredDescription}
          </AlertDescription>
        </Alert>
      ) : result.reason === "completed" ? (
        <Alert>
          <CircleCheck className="size-4" />
          <AlertTitle>{t.invite.alreadySubmittedTitle}</AlertTitle>
          <AlertDescription>
            {t.invite.alreadySubmittedDescription}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <CircleX className="size-4" />
          <AlertTitle>{t.invite.invalidTitle}</AlertTitle>
          <AlertDescription>
            {t.invite.invalidDescription}
          </AlertDescription>
        </Alert>
      )

    return (
      <div className="relative flex min-h-screen items-center justify-center bg-muted/30 p:4">
        <div className="absolute top-4 end-4">
          <LanguageSwitcher />
        </div>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">{content}</CardContent>
        </Card>
      </div>
    )
  }

  // Check if basic info is already completed
  const basicInfoCompleted = result.basicInfoCompletedAt !== null

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>
      <div className="flex w-full max-w-lg flex-col items-center gap-4">
        <BrandLogo height={48} width={82} priority className="mb-4" alt="Coach Flow" />
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t.invite.title}</CardTitle>
            <CardDescription>
              {t.invite.invitedBy.replace("{trainerName}", result.trainerName)}
            </CardDescription>
          </CardHeader>
          {basicInfoCompleted ? (
            // Show account creation form if basic info is already done
            <InviteAccountForm token={token} phone={result.phone ?? null} />
          ) : (
            // Show basic info form first
            <ClientBasicInfoForm token={token} />
          )}
        </Card>
      </div>
    </div>
  )
}