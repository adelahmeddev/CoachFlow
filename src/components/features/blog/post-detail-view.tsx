"use client"

import { useState } from "react"
import { ImageOff } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/client"
import { formatDate } from "@/lib/i18n/format"
import type { Locale } from "@/lib/i18n/config"
import type { BlogCardPost } from "./post-card"

export type BlogDetailPost = BlogCardPost & {
  content: string
  clientDisplayName: string | null
}

function SafeImage({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  const [error, setError] = useState(false)
  if (!src || error) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)} role="img" aria-label={alt}>
        <ImageOff className="size-8 text-muted-foreground/50" aria-hidden="true" />
      </div>
    )
  }
  return <img src={src} alt={alt} onError={() => setError(true)} className={className} />
}

export function PostDetailView({ post }: { post: BlogDetailPost }) {
  const { t, locale } = useI18n()
  const date = post.publishedAt ?? post.createdAt
  const isTransformation = post.category === "TRANSFORMATION"
  const hero = post.coverImageUrl ?? (isTransformation ? post.afterImageUrl : null)

  return (
    <article className="mx-auto w-full max-w-3xl space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-soft">
        <SafeImage src={hero} alt={post.title} className="aspect-[16/9] w-full object-cover" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" aria-hidden="true" />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              isTransformation
                ? "bg-muscle-500/90 text-white hover:bg-muscle-500"
                : "bg-brand-500/10 text-brand-700 hover:bg-brand-500/15 dark:text-brand-300"
            )}
          >
            {(t.blog.categories as Record<string, string>)[post.category] ?? post.category}
          </Badge>
          <span className="text-xs text-muted-foreground tabular-nums">
            {t.blog.publishedOn}: {formatDate(date, locale)}
          </span>
        </div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">{post.title}</h1>
        {post.excerpt ? (
          <p className="text-base font-medium text-muted-foreground">{post.excerpt}</p>
        ) : null}
      </div>

      {isTransformation && (post.beforeImageUrl || post.afterImageUrl) ? (
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <SafeImage src={post.beforeImageUrl} alt={t.blog.before} className="aspect-[3/4] w-full rounded-xl object-cover" />
                <p className="text-center text-sm font-bold">{t.blog.before}</p>
              </div>
              <div className="space-y-2">
                <SafeImage src={post.afterImageUrl} alt={t.blog.after} className="aspect-[3/4] w-full rounded-xl object-cover" />
                <p className="text-center text-sm font-bold text-brand-700 dark:text-brand-300">{t.blog.after}</p>
              </div>
            </div>
            {post.clientDisplayName ? (
              <p className="text-center text-sm text-muted-foreground">{post.clientDisplayName}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-4 sm:p-6">
          <p className="whitespace-pre-wrap text-[15px] leading-8">{post.content}</p>
        </CardContent>
      </Card>
    </article>
  )
}
