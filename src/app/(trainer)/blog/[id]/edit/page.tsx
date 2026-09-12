import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { getCoachPost } from "@/server/services/blog.service"
import { BlogPostForm } from "@/components/features/blog/blog-post-form"
import { Button } from "@/components/ui/button"
import { getI18n } from "@/lib/i18n"

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
