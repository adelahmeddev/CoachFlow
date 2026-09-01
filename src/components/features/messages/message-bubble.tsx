import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Role } from "@/lib/db/enums"

type Message = {
  id: string
  body: string
  senderRole: Role
  createdAt: Date | string
  readAt?: Date | string | null
  pending?: boolean
  failed?: boolean
}

export function MessageBubble({
  message,
  isOwn,
}: {
  message: Message
  isOwn: boolean
}) {
  const createdAt = typeof message.createdAt === "string" ? new Date(message.createdAt) : message.createdAt
  const time = format(createdAt, "HH:mm")
  const ageMs = Date.now() - createdAt.getTime()
  const showSending = isOwn && message.pending === true && ageMs >= 90000
  const showFailed = isOwn && message.failed === true

  return (
    <div className={cn("flex w-full animate-in fade-in-0 slide-in-from-bottom-1 duration-200", isOwn ? "justify-end" : "justify-start")}>
      <div className="max-w-[78%] sm:max-w-[68%]">
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-soft transition-all",
            isOwn
              ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-br-md"
              : "bg-card border text-foreground rounded-bl-md"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
          <div className={cn("mt-1 flex items-center gap-1 text-[10px]", isOwn ? "justify-end text-white/80" : "justify-start text-muted-foreground")}>
            <time className="tabular-nums">{time}</time>
            {isOwn && !showSending && !showFailed && (
              <span className="inline-flex items-center gap-0.5">
                <span aria-hidden="true" className="text-[11px] leading-none">
                  {message.readAt ? "✓✓" : "✓"}
                </span>
              </span>
            )}
            {showSending && <span className="animate-pulse">Sending...</span>}
            {showFailed && <span className="font-medium text-amber-200">Failed — tap to retry</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MessageBubbleSkeleton({ align = "start" }: { align?: "start" | "end" }) {
  return (
    <div className={cn("flex w-full", align === "end" ? "justify-end" : "justify-start")}>
      <div className="h-12 w-40 animate-pulse rounded-2xl bg-[var(--msg-mist)]" />
    </div>
  )
}