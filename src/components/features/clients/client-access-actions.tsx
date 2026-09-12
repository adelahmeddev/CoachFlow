"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Copy, KeyRound, Loader2, RefreshCw, CalendarPlus } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"
import { interpolate } from "@/lib/i18n/format"
import { getInviteUrl } from "@/lib/app-url"
import {
  createLoginForClientAction,
  extendInviteAction,
  resendInviteAction,
} from "@/server/actions/invite"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { InviteState } from "@/lib/invite-status"

export function InviteStatusBadge({
  state,
  daysLeft,
}: {
  state: InviteState
  daysLeft: number | null
}) {
  const { t } = useI18n()
  if (state === "accepted") {
    return (
      <Badge className="bg-performance-500 text-white">
        <CheckCircle2 className="size-3 me-1" />
        {t.clients.inviteStatusAccepted}
      </Badge>
    )
  }
  if (state === "expired") return <Badge variant="destructive">{t.clients.inviteStatusExpired}</Badge>
  if (state === "no-invite") return <Badge variant="outline">—</Badge>
  return (
    <Badge className="bg-energy-500 text-white">
      {daysLeft === null || daysLeft > 0
        ? daysLeft === null
          ? t.clients.inviteStatusPending
          : interpolate(t.clients.inviteExpiresIn, { n: daysLeft })
        : t.clients.inviteExpiresToday}
    </Badge>
  )
}

export function CopyInviteButton({ token, size = "sm" }: { token: string; size?: "sm" | "xs" }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getInviteUrl(token))
      setCopied(true)
      toast.success(t.onboarding.inviteList.linkCopied)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t.toasts.error)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy} className={size === "xs" ? "h-7 gap-1 text-xs" : "gap-1"}>
      {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
      {t.common.copy}
    </Button>
  )
}

export function ResendInviteButton({ clientId }: { clientId: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleResend() {
    if (!window.confirm(t.clients.resendInviteConfirm)) return
    startTransition(async () => {
      const result = await resendInviteAction(clientId)
      if (result.ok) {
        try {
          await navigator.clipboard.writeText(result.inviteUrl)
        } catch {}
        toast.success(t.clients.inviteResent)
        router.refresh()
      } else if (result.error === "ALREADY_ACCEPTED") {
        toast.error(t.clients.alreadyAccepted)
        router.refresh()
      } else {
        toast.error(t.toasts.error)
      }
    })
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleResend} disabled={pending} className="gap-1">
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
      {pending ? t.clients.resendingInvite : t.clients.resendInvite}
    </Button>
  )
}

export function ExtendInviteButton({ clientId }: { clientId: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleExtend() {
    startTransition(async () => {
      const result = await extendInviteAction(clientId, 7)
      if (result.ok) {
        toast.success(t.clients.inviteExtended)
        router.refresh()
      } else if (result.error === "ALREADY_ACCEPTED") {
        toast.error(t.clients.alreadyAccepted)
        router.refresh()
      } else {
        toast.error(t.toasts.error)
      }
    })
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleExtend} disabled={pending} className="gap-1">
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <CalendarPlus className="size-3.5" />}
      {pending ? t.clients.extendingInvite : t.clients.extendInvite}
    </Button>
  )
}

export function CreateLoginDialog({
  clientId,
  clientName,
  trigger,
}: {
  clientId: string
  clientName: string
  trigger?: React.ReactNode
}) {
  const { t } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [credentials, setCredentials] = useState<{ username: string; tempPassword: string } | null>(null)

  function handleCreate() {
    startTransition(async () => {
      const result = await createLoginForClientAction(clientId)
      if (result.ok) {
        setCredentials({ username: result.username, tempPassword: result.tempPassword })
        toast.success(t.clients.createLoginSuccess)
        router.refresh()
      } else if (result.error === "ALREADY_HAS_LOGIN") {
        toast.error(t.clients.createLoginAlreadyHas)
        setOpen(false)
        router.refresh()
      } else if (result.error === "PHONE_TAKEN") {
        toast.error(t.clients.createLoginPhoneTaken)
      } else {
        toast.error(t.toasts.error)
      }
    })
  }

  async function handleCopyCredentials() {
    if (!credentials) return
    try {
      await navigator.clipboard.writeText(
        `${t.clients.loginUsernameLabel}: ${credentials.username}\n${t.clients.tempPasswordLabel}: ${credentials.tempPassword}`
      )
      toast.success(t.clients.credentialsCopied)
    } catch {
      toast.error(t.toasts.error)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setCredentials(null)
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <KeyRound className="size-4" />
            {t.clients.createLogin}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {interpolate(t.clients.createLoginTitle, { name: clientName })}
          </DialogTitle>
          <DialogDescription>{t.clients.createLoginDescription}</DialogDescription>
        </DialogHeader>
        {credentials ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-energy-500/40 bg-energy-500/5 p-3 text-xs text-muted-foreground">
              {t.clients.credentialsWarning}
            </div>
            <dl className="space-y-2 rounded-xl border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs text-muted-foreground">{t.clients.loginUsernameLabel}</dt>
                <dd className="font-mono font-bold tabular-nums" dir="ltr">{credentials.username}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs text-muted-foreground">{t.clients.tempPasswordLabel}</dt>
                <dd className="font-mono font-bold tabular-nums" dir="ltr">{credentials.tempPassword}</dd>
              </div>
            </dl>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t.common.close}
              </Button>
              <Button type="button" onClick={handleCopyCredentials} className="gap-1">
                <Copy className="size-4" />
                {t.clients.copyCredentials}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              {t.common.cancel}
            </Button>
            <Button type="button" onClick={handleCreate} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin me-2" /> : null}
              {pending ? t.clients.creatingLogin : t.clients.createLoginButton}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
