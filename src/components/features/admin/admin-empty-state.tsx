import type { LucideIcon } from "lucide-react"
import { Users } from "lucide-react"

export function AdminEmptyState({
  title,
  description,
  icon: Icon = Users,
}: {
  title: string
  description: string
  icon?: LucideIcon
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
