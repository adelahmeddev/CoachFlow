import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getPublishedPostForClient } from "@/server/services/blog.service"
import { PostDetailView } from "@/components/features/blog/post-detail-view"
import { Button } from "@/components/ui/button"
import { getI18n } from "@/lib/i18n"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ClientBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { t } = await getI18n()
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId

  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    redirect("/client/login")
  }

  const { id } = await params
  // Published-only + own-coach-only — drafts and other coaches' posts 404.
  const result = await getPublishedPostForClient(clientId, id)
  if (!result) {
    notFound()
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/client/home">
          <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          {t.blog.backToPosts}
        </Link>
      </Button>
      <PostDetailView post={result.post} />
    </div>
  )
}
