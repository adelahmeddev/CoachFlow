import { getCurrentSession } from "@/server/auth"
import { listMediaForClientOfTrainer } from "@/server/services/media.service"
import { getI18n } from "@/lib/i18n"
import { MediaGallery } from "./media-gallery"

export async function MediaTab({ clientId }: { clientId: string }) {
  const { t, locale } = await getI18n()
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "COACH" || !session.user.trainerProfileId) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{t.toasts.unauthorized}</p>
      </div>
    )
  }

  const items = (await listMediaForClientOfTrainer(clientId, session.user.trainerProfileId, 30)) ?? []

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t.media.title}</h2>
        <p className="text-muted-foreground">{t.media.subtitle}</p>
      </div>
      <MediaGallery
        items={items}
        locale={locale}
        canReview
        emptyTitle={t.media.noMedia}
        emptyDescription={t.media.noMediaDescription}
      />
    </div>
  )
}
