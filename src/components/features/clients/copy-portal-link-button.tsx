"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Button } from "@/components/ui/button"

export function CopyPortalLinkButton({ portalUrl }: { portalUrl: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(portalUrl)
      } else {
        const ta = document.createElement("textarea")
        ta.value = portalUrl
        ta.setAttribute("readonly", "")
        ta.style.position = "fixed"
        ta.style.opacity = "0"
        document.body.appendChild(ta)
        ta.select()
        document.execCommand("copy")
        document.body.removeChild(ta)
      }
      setCopied(true)
      toast.success(lookup(t, "client.profile.linkCopied"))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Copy failed")
    }
  }

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? lookup(t, "client.profile.linkCopied") : lookup(t, "client.profile.copyLink")}
    </Button>
  )
}
