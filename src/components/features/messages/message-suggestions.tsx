"use client"

import { useI18n } from "@/lib/i18n/client"
import { pickSuggestions, MENTIONS, labelFor, type ClientContext, type Suggestion } from "@/lib/messages/suggestions"
import { cn } from "@/lib/utils"
import type { Role } from "@/generated/prisma/enums"

export function MessageSuggestions({
  role,
  context,
  onPick,
  onMention,
}: {
  role: Role
  context?: ClientContext
  onPick: (text: string) => void
  onMention?: (text: string) => void
}) {
  const { locale } = useI18n()
  const normalized: "TRAINER" | "CLIENT" = role === "CLIENT" ? "CLIENT" : "TRAINER"
  const suggestions = pickSuggestions(normalized, locale as any, context, 6)

  return (
    <div className="space-y-2 border-t border-[var(--msg-mist)] bg-[var(--msg-paper)] px-3 py-3">
      <div className="flex items-center gap-3">
        <span className="hidden font-[var(--font-barlow-condensed)] text-[10px] tracking-[0.14em] uppercase text-[var(--msg-text-muted)] sm:block">Quick Replies</span>
        <div className="flex flex-1 gap-2 overflow-x-auto no-scrollbar pb-1">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onPick(s.insertAr && locale === "ar" ? s.insertAr : s.insertEn)}
              className="shrink-0 rounded-full border border-[var(--msg-mist)] bg-[var(--msg-paper)]/90 px-4 py-2 font-[var(--font-barlow)] text-xs font-semibold tracking-tight text-[var(--msg-text-on-paper)] shadow-sm backdrop-blur hover:border-[var(--msg-orange)] hover:bg-[var(--msg-orange)]/10 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--msg-orange)] active:scale-[0.98] transition-all whitespace-nowrap min-h-[40px]"
            >
              <span className="flex items-center gap-2">
                <span className="size-1.5 shrink-0 rounded-full bg-[var(--msg-orange)]" aria-hidden="true" />
                {labelFor(s, locale as any)}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-[var(--font-barlow-condensed)] text-[10px] tracking-[0.14em] uppercase text-[var(--msg-text-muted)]">Mentions</span>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {MENTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => (onMention ?? onPick)(m.insertAr && locale === "ar" ? m.insertAr : m.insertEn)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 font-[var(--font-barlow)] text-xs font-medium tracking-wide shadow-sm backdrop-blur transition-all hover:shadow-md active:scale-[0.98] min-h-[40px]",
                m.ctx === "nutrition" && "border-[var(--msg-accent-green)]/30 bg-[var(--msg-accent-green)]/10 text-[var(--msg-accent-green)] hover:bg-[var(--msg-accent-green)]/20",
                m.ctx === "workout" && "border-[var(--msg-orange)]/30 bg-[var(--msg-orange)]/10 text-[var(--msg-orange)] hover:bg-[var(--msg-orange)]/20",
                m.ctx === "inbody" && "border-[var(--msg-accent-blue)]/30 bg-[var(--msg-accent-blue)]/10 text-[var(--msg-accent-blue)] hover:bg-[var(--msg-accent-blue)]/20",
                m.ctx === "general" && "border-[var(--msg-mist)] bg-[var(--msg-paper)]/80 text-[var(--msg-text-on-paper)] hover:bg-[var(--msg-paper)]"
              )}
            >
              {labelFor(m, locale as any)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}