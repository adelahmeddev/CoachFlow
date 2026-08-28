"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"
import { GenerateInviteButton } from "@/components/features/onboarding/generate-invite-button"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"

type GeneratedInvite = {
  clientId: string
  invitePath: string
  inviteUrl: string
}

export function InviteCard() {
  const { t } = useI18n()
  const [invite, setInvite] = useState<GeneratedInvite | null>(null)
  const [copied, setCopied] = useState(false)

  async function copyText(text: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch {}
    try {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.setAttribute("readonly", "")
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }

  async function handleCopy() {
    if (!invite) return
    const ok = await copyText(invite.inviteUrl)
    if (ok) {
      setCopied(true)
      toast.success(t.onboarding.inviteCard.linkCopied)
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error("Copy failed — please copy manually")
      window.prompt("Copy link:", invite.inviteUrl)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.onboarding.inviteCard.title}</CardTitle>
        <CardDescription>
          {t.onboarding.inviteCard.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenerateInviteButton onGenerated={setInvite} />

        {invite && (
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-center">
            <code className="flex-1 truncate text-sm">{invite.inviteUrl}</code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
            >
              {copied ? <Check /> : <Copy />}
              {copied ? t.onboarding.inviteCard.copied : t.onboarding.inviteCard.copy}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
