"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Copy, ExternalLink, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ClientQuickActionsProps {
  phone: string | null
  clientName: string
  portalUrl: string
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (!digits) return ""
  if (digits.startsWith("0")) {
    return "20" + digits.slice(1)
  }
  if (digits.startsWith("20")) return digits
  return digits
}

function buildWhatsAppUrl(phone: string, clientName: string, locale: string): string | null {
  const normalized = normalizePhone(phone)
  if (!normalized) return null
  const arMessage = `أهلاً ${clientName} 👋 متنساش تبدأ تمرينك النهارده 💪🔥 شد حيلك وخلّي التمرين يخلص قبل ما اليوم يخلص!`
  const enMessage = `Hey ${clientName} 👋 Don't forget to start your workout today! 💪🔥 Stay on track and get it done!`
  const message = locale === "ar" ? arMessage : enMessage
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${normalized}?text=${encoded}`
}

export function ClientQuickActions({ phone, clientName, portalUrl }: ClientQuickActionsProps) {
  const { t, locale } = useI18n()
  const [copied, setCopied] = useState(false)

  const whatsappUrl = phone ? buildWhatsAppUrl(phone, clientName, locale) : null

  async function handleCopyLink() {
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
    <div className="grid gap-4 sm:grid-cols-2">
      {whatsappUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="size-4 text-green-600" />
              {lookup(t, "client.profile.whatsappReminder")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                {lookup(t, "client.profile.whatsappReminder")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ExternalLink className="size-4 text-blue-600" />
            {lookup(t, "client.profile.portalLink")}
          </CardTitle>
          <CardDescription>{lookup(t, "client.profile.portalLinkDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
            <code className="flex-1 truncate text-xs">{portalUrl}</code>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={handleCopyLink}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? lookup(t, "client.profile.linkCopied") : lookup(t, "client.profile.copyLink")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
