"use client"

import { useState } from "react"
import { Link2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { generateInviteAction } from "@/server/actions/invite"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/client"

type GeneratedInvite = {
  clientId: string
  invitePath: string
  inviteUrl: string
}

export function GenerateInviteButton({
  onGenerated,
}: {
  onGenerated: (invite: GeneratedInvite) => void
}) {
  const { t } = useI18n()
  const [isPending, setIsPending] = useState(false)

  async function handleGenerate() {
    setIsPending(true)
    try {
      const result = await generateInviteAction()
      if (!result.ok) {
        toast.error(result.error ?? t.onboarding.generateInvite.error)
        return
      }
      onGenerated(result)
      toast.success(t.onboarding.generateInvite.generated)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button onClick={handleGenerate} disabled={isPending}>
      {isPending ? <Loader2 className="animate-spin" /> : <Link2 className="size-4" />}
      {t.onboarding.generateInvite.button}
    </Button>
  )
}
