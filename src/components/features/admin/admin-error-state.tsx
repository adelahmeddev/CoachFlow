import { AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AdminErrorState({
  title,
  description,
  retryHref,
  retryLabel,
}: {
  title: string
  description: string
  retryHref: string
  retryLabel: string
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <p className="font-medium">{title}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
          <Button asChild variant="outline" className="mt-2">
            <a href={retryHref}>{retryLabel}</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
