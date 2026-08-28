import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Role } from "@/generated/prisma/enums"

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
    <div className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
      <div className="max-w-[85%]">
        <div className={cn(
          "rounded-2xl border px-3 py-2 shadow-sm backdrop-blur",
          isOwn
            ? "border-[var(--msg-orange)]/30 bg-[var(--msg-orange)]/10 border-r-[3px] border-r-[var(--msg-orange)]"
            : "border-[var(--msg-mist)] bg-[var(--msg-paper)]/80 border-l-[3px] border-l-[var(--msg-mist)]"
        )}>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--msg-text-on-paper)]">{message.body}</p>
          <div className={cn("flex items-center gap-1.5 mt-1 text-[10px] text-[var(--msg-text-muted)]", isOwn ? "justify-end" : "justify-start")}>
            <time>{format(new Date(message.createdAt), "HH:mm")}</time>
            {showSending && <span>Sending...</span>}
            {showFailed && <span className="text-[var(--msg-orange)] font-medium">Failed — tap to retry</span>}
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