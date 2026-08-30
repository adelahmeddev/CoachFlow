"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Copy, MessageCircle } from "lucide-react"
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

function buildWhatsAppUrl(phone: string, clientName: string, portalUrl: string, locale: string): string | null {
  const normalized = normalizePhone(phone)
  if (!normalized) return null
  const arMessage = `أهلاً ${clientName} 👋\nتفضل رابط بوابتك عشان تتابع خطتك التدريبية:\n${portalUrl}`
  const enMessage = `Hey ${clientName} 👋\nHere's your portal link to follow your training plan:\n${portalUrl}`
  const message = locale === "ar" ? arMessage : enMessage
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${normalized}?text=${encoded}`
}

async function copyToClipboard(text: string): Promise<boolean> {
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

export function ClientQuickActions({ phone, clientName, portalUrl }: ClientQuickActionsProps) {
  const { t, locale } = useI18n()
  const [copied, setCopied] = useState(false)

  const whatsappUrl = phone ? buildWhatsAppUrl(phone, clientName, portalUrl, locale) : null

  async function handleCopyLink() {
    const ok = await copyToClipboard(portalUrl)
    if (ok) {
      setCopied(true)
      toast.success(lookup(t, "client.profile.linkCopied"))
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error("Copy failed")
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="size-4 text-green-600" />
          {lookup(t, "client.profile.portalLink")}
        </CardTitle>
        <CardDescription>{lookup(t, "client.profile.portalLinkDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
          <code className="flex-1 truncate text-xs">{portalUrl}</code>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={handleCopyLink}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? lookup(t, "client.profile.linkCopied") : lookup(t, "client.profile.copyLink")}
          </Button>
          {whatsappUrl && (
            <Button asChild variant="outline" className="flex-1 gap-2">
              <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4 text-green-600" />
                WhatsApp
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
