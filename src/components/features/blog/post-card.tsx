"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, ImageOff } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/client"
import { formatDate } from "@/lib/i18n/format"
import type { Locale } from "@/lib/i18n/config"

export type BlogCardPost = {
  id: string
  category: string
  title: string
  excerpt: string | null
  coverImageUrl: string | null
  beforeImageUrl: string | null
  afterImageUrl: string | null
  publishedAt: string | Date | null
  createdAt: string | Date
}

function categoryLabel(t: ReturnType<typeof useI18n>["t"], category: string): string {
  return (t.blog.categories as Record<string, string>)[category] ?? category
}

export function PostCard({ post, href }: { post: BlogCardPost; href: string }) {
  const { t, locale } = useI18n()
  const [imgError, setImgError] = useState(false)
  const cover = post.coverImageUrl ?? (post.category === "TRANSFORMATION" ? post.afterImageUrl : null)
  const date = post.publishedAt ?? post.createdAt

  const isTransformation = post.category === "TRANSFORMATION"
  return (
    <Link href={href} className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl">
      <Card className={cn("h-full overflow-hidden card-lift", isTransformation && "ring-1 ring-performance-500/20 shadow-[0_0_22px_-12px_rgba(34,197,94,0.35)]")}>
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {cover && !imgError ? (
            <img
              src={cover}
              alt={post.title}
              loading="lazy"
              onError={() => setImgError(true)}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-brand-500/15 via-brand-500/5 to-transparent">
              <ImageOff className="size-8 text-muted-foreground/50" aria-hidden="true" />
            </div>
          )}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" aria-hidden="true" />
          <Badge
            className={cn(
              "absolute start-3 top-3 shadow-soft backdrop-blur",
              post.category === "TRANSFORMATION"
                ? "bg-gradient-to-r from-performance-500 to-performance-600 text-white hover:brightness-110 border-0"
                : "bg-card/90 text-brand-700 hover:bg-card dark:text-brand-300"
            )}
          >
            {isTransformation ? `✦ ${categoryLabel(t, post.category)}` : categoryLabel(t, post.category)}
          </Badge>
          {isTransformation && cover && !imgError && (
            <span className="absolute bottom-2 end-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
              Before → After
            </span>
          )}
        </div>
        <CardContent className="min-w-0 space-y-2 p-4">
          <h3 className="font-heading font-bold leading-snug tracking-tight break-words line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300">
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className="text-sm text-muted-foreground break-words line-clamp-2">{post.excerpt}</p>
          ) : null}
          <div className="flex min-w-0 items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
            <span className="min-w-0 flex-1 truncate tabular-nums">{formatDate(date, locale)}</span>
            <span className="inline-flex items-center gap-1 font-medium text-brand-700 dark:text-brand-300">
              {t.blog.readMore}
              <ArrowRight className="size-3.5 rtl:-scale-x-100 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
