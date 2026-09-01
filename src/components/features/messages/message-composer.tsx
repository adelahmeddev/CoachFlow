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
    return <div className="border-t bg-muted/20 px-4 py-4 text-center"><p className="text-sm text-muted-foreground">{t.client.messages.archived ?? "Archived"}</p></div>
  }

  return (
    <div className="border-t bg-card px-3 py-3 sm:px-4">
      <div className="flex items-end gap-2">
        <button
          type="button"
          className="hidden sm:flex size-10 shrink-0 items-center justify-center rounded-xl border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Attachment"
          title="Attachment"
        >
          <span aria-hidden="true" className="text-lg leading-none">📎</span>
        </button>
        <div className="relative flex-1">
          <textarea
            ref={ref}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t.client.messages.typePlaceholder}
            rows={1}
            className="max-h-28 min-h-[44px] w-full resize-none rounded-2xl border bg-muted/30 px-4 py-3 pr-10 text-sm leading-relaxed placeholder:text-muted-foreground focus:border-brand-300 focus:bg-card focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            disabled={disabled || isPending}
            aria-label={t.client.messages.typePlaceholder}
            autoComplete="off"
          />
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 hidden sm:block">
            ↵
          </span>
        </div>
        <button
          onClick={onSend}
          disabled={!body.trim() || isPending || disabled}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-soft hover:bg-foreground/90 active:scale-[0.97] disabled:opacity-50 transition-all"
          aria-label={t.client.messages.send}
        >
          {isPending ? <svg className="size-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></path></svg> : <svg className="size-4 rtl:-scale-x-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
        </button>
      </div>
      <div className="mt-2 hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {["تمام يا كوتش 💪", "تم ✅", "محتاج تعديل؟", "برافو!"].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setBody(q)}
            className="shrink-0 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:border-brand-200 hover:text-foreground hover:bg-brand-500/5 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}