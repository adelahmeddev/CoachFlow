import { getI18n } from "@/lib/i18n"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default async function ClientPortalNotFound() {
  const { t } = await getI18n()

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <CardTitle className="text-xl">{t.common.notFound}</CardTitle>
          <CardDescription>{t.common.error}</CardDescription>
          <Button asChild>
            <Link href="/client/home">
              <Home className="size-4 me-2" />
              {t.client.home.greeting}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
