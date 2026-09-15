import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { getI18n } from "@/lib/i18n"

const BlogPostForm = dynamic(
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

export default async function NewBlogPostPage() {
  const { t } = await getI18n()
  const session = await getCurrentSession()

  if (!session?.user || session.user.role !== "COACH" || !session.user.trainerProfileId) {
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
      <BlogPostForm />
    </div>
  )
}
