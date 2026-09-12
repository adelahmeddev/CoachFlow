"use client"

import { Newspaper } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"
import { PostCard, type BlogCardPost } from "./post-card"

export function BlogSection({ posts }: { posts: BlogCardPost[] }) {
  const { t } = useI18n()

  return (
    <section aria-label={t.blog.title} className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-soft ring-1 ring-white/10">
          <Newspaper className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-extrabold tracking-tight">{t.blog.title}</h2>
          <p className="text-xs text-muted-foreground">{t.blog.subtitle}</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-500/10">
              <Newspaper className="size-7 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            </span>
            <p className="font-semibold">{t.blog.noPublishedPosts}</p>
            <p className="text-sm text-muted-foreground">{t.blog.noPublishedDescription}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="scroll-row no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
          {posts.map((post) => (
            <div key={post.id} className="w-[82%] sm:w-auto">
              <PostCard post={post} href={`/client/blog/${post.id}`} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
