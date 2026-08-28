"use client"

import { useState, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/lib/i18n/client"
import { sendMessageAction } from "@/server/actions/messages"

type Props = {
  conversationId?: string
  clientId?: string
  disabled?: boolean
  archived?: boolean
  value?: string
  onChange?: (v: string) => void
  onOptimistic?: (body: string) => string
  onSent?: (tempId: string, realId?: string) => void
  onFailed?: (tempId: string) => void
}

export function MessageComposer({
  conversationId,
  clientId,
  disabled,
  archived,
  value: controlledValue,
  onChange: controlledOnChange,
  onOptimistic,
  onSent,
  onFailed,
}: Props) {
  const { t } = useI18n()
  const router = useRouter()
  const [internalBody, setInternalBody] = useState("")
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLTextAreaElement>(null)

  const isControlled = controlledValue !== undefined
  const body = isControlled ? controlledValue! : internalBody
  const setBody = (v: string) => { if (isControlled) controlledOnChange?.(v); else setInternalBody(v) }

  async function onSend() {
    const trimmed = body.trim()
    if (!trimmed || isPending || disabled || archived) return
    const optimistic = trimmed
    let tempId: string | null = null
    if (onOptimistic) { tempId = onOptimistic(optimistic) }
    setBody("")

    startTransition(async () => {
      const res = await sendMessageAction({ conversationId, clientId, body: optimistic })
      if (!res.ok) {
        toast.error(res.error || t.toasts.error)
        setBody(optimistic)
        if (tempId && onFailed) onFailed(tempId)
        return
      }
      if (tempId && onSent) onSent(tempId, (res as any).messageId)
      router.refresh()
      ref.current?.focus()
    })
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void onSend() } }

  if (archived) {
    return <div className="border-t border-[var(--msg-mist)] px-4 py-4 text-center"><p className="font-[var(--font-barlow)] text-sm text-[var(--msg-text-muted)]">Archived</p></div>
  }

  return (
    <div className="border-t border-[var(--msg-mist)] bg-[var(--msg-paper)] px-4 py-3">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={ref}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t.client.messages.typePlaceholder}
            rows={1}
            className="max-h-32 min-h-[44px] resize-none rounded-2xl border border-[var(--msg-mist)] bg-[var(--msg-steel)] px-4 py-3 font-[var(--font-barlow)] text-sm leading-relaxed text-[var(--msg-text-on-paper)] placeholder:text-[var(--msg-text-muted)] focus:border-[var(--msg-orange)] focus:ring-2 focus:ring-[var(--msg-or-orange)]/20 outline-none"
            disabled={disabled || isPending}
            aria-label={t.client.messages.typePlaceholder}
            autoComplete="off"
          />
        </div>
        <button
          onClick={onSend}
          disabled={!body.trim() || isPending || disabled}
          className="size-10 shrink-0 rounded-2xl bg-[var(--msg-orange)] text-white shadow-[0_4px_12px_rgba(255,107,53,0.3)] hover:bg-[var(--msg-orange)]/90 active:scale-[0.97] disabled:opacity-50 flex items-center justify-center"
          aria-label={t.client.messages.send}
        >
          {isPending ? <svg className="size-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></path></svg> : <svg className="size-5 rtl:-scale-x-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
        </button>
      </div>
    </div>
  )
}