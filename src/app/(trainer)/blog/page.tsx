import Link from "next/link"
import { notFound } from "next/navigation"
import { Plus } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { listCoachPosts } from "@/server/services/blog.service"
import { Button } from "@/components/ui/button"
import { CoachPostsList } from "@/components/features/blog/coach-posts-list"
import { getI18n } from "@/lib/i18n"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function BlogListPage() {
  const { t } = await getI18n()
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== "COACH" || !session.user.trainerProfileId) {
    notFound()
  }

  const posts = await listCoachPosts(session.user.trainerProfileId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.blog.title}</h1>
          <p className="text-muted-foreground">{t.blog.subtitle}</p>
        </div>
        <Button asChild>
          <Link href="/blog/new">
            <Plus className="me-1 h-4 w-4" />
            {t.blog.newPost}
          </Link>
        </Button>
      </div>

      <CoachPostsList posts={posts} />
    </div>
  )
}
