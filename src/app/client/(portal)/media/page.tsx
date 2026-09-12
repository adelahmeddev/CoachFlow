import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getCurrentSession } from "@/server/auth"
import { listMediaForClient } from "@/server/services/media.service"
import { MediaGallery } from "@/components/features/media/media-gallery"
import { MediaUploadForm } from "@/components/features/media/media-upload-form"
import { getI18n } from "@/lib/i18n"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return { title: t.media.myTitle }
}

export default async function ClientMediaPage() {
  const { t, locale } = await getI18n()
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    redirect("/client/login")
  }

  const items = await listMediaForClient(clientId, { limit: 30 })

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.media.myTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.media.mySubtitle}</p>
      </div>
      <MediaUploadForm />
      <MediaGallery
        items={items}
        locale={locale}
        canReview={false}
        emptyTitle={t.media.noMedia}
        emptyDescription={t.media.noMediaClient}
      />
    </div>
  )
}
