"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Newspaper, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "@/lib/i18n/client"
import { formatDate } from "@/lib/i18n/format"
import type { Locale } from "@/lib/i18n/config"
import { deletePostAction, togglePublishAction } from "@/server/actions/blog"

type PostRow = {
  id: string
  category: string
  title: string
  published: boolean
  createdAt: string | Date
}

export function CoachPostsList({ posts }: { posts: PostRow[] }) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [pending, startTransition] = useTransition()

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-500/10">
            <Newspaper className="size-7 text-brand-600 dark:text-brand-400" aria-hidden="true" />
          </span>
          <p className="font-semibold">{t.blog.noPosts}</p>
          <p className="text-sm text-muted-foreground">{t.blog.noPostsDescription}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <Badge variant={post.published ? "default" : "secondary"}>
                {post.published ? t.blog.published : t.blog.draft}
              </Badge>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDate(post.createdAt, locale)}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
                {(t.blog.categories as Record<string, string>)[post.category] ?? post.category}
              </p>
              <h3 className="font-heading font-bold leading-snug line-clamp-2">{post.title}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
                <Switch
                  checked={post.published}
                  disabled={pending}
                  onCheckedChange={(v) =>
                    startTransition(async () => {
                      const res = await togglePublishAction(post.id, v)
                      if (!res.ok) toast.error(res.error)
                      router.refresh()
                    })
                  }
                  aria-label={post.published ? t.blog.actions.unpublish : t.blog.actions.publish}
                />
                {post.published ? t.blog.actions.unpublish : t.blog.actions.publish}
              </label>
              <span className="flex-1" />
              <Button asChild variant="outline" size="sm" disabled={pending}>
                <Link href={`/blog/${post.id}/edit`}>
                  <Pencil className="size-3.5" aria-hidden="true" />
                  {t.common.edit}
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    if (!confirm(t.blog.actions.deleteConfirm)) return
                    const res = await deletePostAction(post.id)
                    if (!res.ok) toast.error(res.error)
                    else toast.success(t.common.deleted)
                    router.refresh()
                  })
                }
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                {t.common.delete}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
