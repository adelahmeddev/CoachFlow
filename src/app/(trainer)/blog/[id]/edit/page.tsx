import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getCoachPost } from "@/server/services/blog.service"
import nextDynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { getI18n } from "@/lib/i18n"

const BlogPostForm = nextDynamic(
  () => import("@/components/features/blog/blog-post-form").then((m) => m.BlogPostForm),
  {
    loading: () => (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-10 bg-muted rounded w-1/2" />
        <div className="h-64 bg-muted rounded" />
      </div>
    ),
  }
)

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { t } = await getI18n()
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== "COACH" || !session.user.trainerProfileId) {
    notFound()
  }

  const { id } = await params
  const post = await getCoachPost(session.user.trainerProfileId, id)
  if (!post) {
    notFound()
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/blog">
          <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          {t.blog.backToPosts}
        </Link>
      </Button>
      <BlogPostForm post={post} />
    </div>
  )
}
