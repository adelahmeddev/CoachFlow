import { getI18n } from "@/lib/i18n"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default async function AdminNotFound() {
  const { t } = await getI18n()

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <CardTitle className="text-xl">{t.common.notFound}</CardTitle>
          <CardDescription>{t.admin.dashboard.noClients}</CardDescription>
          <Button asChild>
            <Link href="/admin">
              <Home className="size-4 me-2" />
              {t.nav.admin}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
