"use client"

import { useEffect, useState } from "react"
import { Check, Copy, RefreshCw, Share2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"
import { getJoinLinkAction, regenerateJoinLinkAction } from "@/server/actions/invite"

export function JoinLinkCard() {
  const { t } = useI18n()
  const [joinUrl, setJoinUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    getJoinLinkAction().then((res) => {
      if (res.ok) setJoinUrl(res.joinUrl)
      setLoading(false)
    })
  }, [])

  async function copyText(text: string) {
    // Secure context (https/localhost) has navigator.clipboard, IP http does not
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch {}
    // Fallback for http / older browsers
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
    if (!joinUrl) return
    const ok = await copyText(joinUrl)
    if (ok) {
      setCopied(true)
      toast.success(t.onboarding.inviteCard.linkCopied)
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error("Copy failed — please copy manually")
      // Select for manual copy
      window.prompt("Copy link:", joinUrl)
    }
  }

  async function handleRegenerate() {
    if (!confirm(t.onboarding.inviteCard.regenerateConfirm ?? "Generate a new link? Old link will expire in 5 minutes.")) return
    setRegenerating(true)
    const res = await regenerateJoinLinkAction()
    setRegenerating(false)
    if (res.ok) {
      setJoinUrl(res.joinUrl)
      toast.success(t.onboarding.inviteCard.regenerated ?? "Link regenerated")
    } else {
      toast.error(res.error)
    }
  }

  async function handleShare() {
    if (!joinUrl) return
    const shareData = { title: t.onboarding.title, text: t.onboarding.inviteCard.description, url: joinUrl }
    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch {}
    }
    // No Web Share — open WhatsApp directly; also try to copy in background (best-effort)
    copyText(joinUrl)
    window.open(`https://wa.me/?text=${encodeURIComponent(joinUrl)}`, "_blank")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.onboarding.inviteCard.title}</CardTitle>
        <CardDescription>{t.onboarding.inviteCard.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t.common.loading}</p>
        ) : joinUrl ? (
          <>
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-center">
              <code className="flex-1 truncate text-sm">{joinUrl}</code>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check /> : <Copy />}
                  {copied ? t.onboarding.inviteCard.copied : t.onboarding.inviteCard.copy}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="size-4" />
                  WhatsApp
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleRegenerate} disabled={regenerating}>
                <RefreshCw className={`size-4 ${regenerating ? "animate-spin" : ""}`} />
                {t.onboarding.inviteCard.regenerate ?? "Regenerate link"}
              </Button>
              <span className="text-xs text-muted-foreground self-center">{t.onboarding.inviteCard.stableHint ?? "Same link until you regenerate"}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-destructive">Failed to create link</p>
        )}
      </CardContent>
    </Card>
  )
}
