import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import { BlogPostForm } from "@/components/features/blog/blog-post-form"
import { Button } from "@/components/ui/button"
import { getI18n } from "@/lib/i18n"

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
