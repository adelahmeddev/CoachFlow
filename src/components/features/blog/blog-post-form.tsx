"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ImagePlus, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useI18n } from "@/lib/i18n/client"
import { blogPostSchema, type BlogPostInput } from "@/lib/validations/blog"
import { PostCategory } from "@/lib/db/enums"
import {
  createPostAction,
  updatePostAction,
  uploadPostImageAction,
} from "@/server/actions/blog"
import { PostDetailView, type BlogDetailPost } from "./post-detail-view"

type PostLike = {
  id: string
  category: string
  title: string
  excerpt: string | null
  content: string
  coverImageUrl: string | null
  beforeImageUrl: string | null
  afterImageUrl: string | null
  clientDisplayName: string | null
  published: boolean
  publishedAt: string | Date | null
  createdAt: string | Date
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (url: string) => void
}) {
  const { t } = useI18n()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.set("file", f)
      const res = await uploadPostImageAction(fd)
      if (!res.ok) {
        setError(res.error)
        return
      }
      onChange(res.url)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {value ? (
        <div className="relative w-full max-w-sm overflow-hidden rounded-xl border">
          <img src={value} alt="" className="aspect-[16/9] w-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            className="absolute end-2 top-2"
            onClick={() => onChange("")}
            aria-label={t.blog.form.removeImage}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <label className="flex min-h-[96px] w-full max-w-sm cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-muted/30 px-4 py-4 text-sm text-muted-foreground transition-colors hover:border-brand-400 hover:text-foreground">
          {uploading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t.blog.form.uploading}
            </span>
          ) : (
            <>
              <ImagePlus className="size-5" aria-hidden="true" />
              <span>{label}</span>
            </>
          )}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onFile} disabled={uploading} className="sr-only" />
        </label>
      )}
      {error ? (
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

export function BlogPostForm({ post }: { post?: PostLike }) {
  const router = useRouter()
  const { t } = useI18n()
  const isEdit = Boolean(post)
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const form = useForm<BlogPostInput>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      category: (post?.category as PostCategory) ?? PostCategory.GENERAL,
      title: post?.title ?? "",
      excerpt: post?.excerpt ?? "",
      content: post?.content ?? "",
      coverImageUrl: post?.coverImageUrl ?? "",
      beforeImageUrl: post?.beforeImageUrl ?? "",
      afterImageUrl: post?.afterImageUrl ?? "",
      clientDisplayName: post?.clientDisplayName ?? "",
      published: post?.published ?? false,
    },
  })

  const watched = form.watch()
  const isTransformation = watched.category === PostCategory.TRANSFORMATION
  const previewPost: BlogDetailPost = {
    id: post?.id ?? "preview",
    category: watched.category,
    title: watched.title || t.blog.form.titlePlaceholder,
    excerpt: watched.excerpt || null,
    content: watched.content || "",
    coverImageUrl: watched.coverImageUrl || null,
    beforeImageUrl: watched.beforeImageUrl || null,
    afterImageUrl: watched.afterImageUrl || null,
    clientDisplayName: watched.clientDisplayName || null,
    publishedAt: post?.publishedAt ?? null,
    createdAt: post?.createdAt ?? new Date(),
  }

  function toPayload(v: BlogPostInput) {
    return {
      ...v,
      excerpt: v.excerpt || null,
      coverImageUrl: v.coverImageUrl || null,
      beforeImageUrl: v.beforeImageUrl || null,
      afterImageUrl: v.afterImageUrl || null,
      clientDisplayName: v.clientDisplayName || null,
    }
  }

  function onSubmit(values: BlogPostInput) {
    setServerError(null)
    startTransition(async () => {
      const res = isEdit && post
        ? await updatePostAction(post.id, toPayload(values))
        : await createPostAction(toPayload(values))
      if (!res.ok) {
        if (res.error === "INVALID_INPUT" && "fieldErrors" in res && res.fieldErrors) {
          for (const [field, msgs] of Object.entries(res.fieldErrors)) {
            if (msgs?.[0]) form.setError(field as keyof BlogPostInput, { message: msgs[0] })
          }
        } else {
          setServerError(res.error)
        }
        return
      }
      toast.success(t.common.saved)
      router.push("/blog")
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button type="button" variant="outline" onClick={() => setShowPreview((v) => !v)}>
          {t.blog.preview}
        </Button>
      </div>

      {showPreview ? (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <PostDetailView post={previewPost} />
          </CardContent>
        </Card>
      ) : null}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {serverError ? (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? t.blog.editPost : t.blog.newPost}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="blog-title">{t.blog.form.title}</Label>
                <Input id="blog-title" {...form.register("title")} placeholder={t.blog.form.titlePlaceholder} maxLength={160} />
                {form.formState.errors.title ? <p className="text-xs text-destructive">{form.formState.errors.title.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label>{t.blog.form.category}</Label>
                <Select value={watched.category} onValueChange={(v) => form.setValue("category", v as PostCategory, { shouldValidate: true })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PostCategory).map((c) => (
                      <SelectItem key={c} value={c}>
                        {t.blog.categories[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category ? <p className="text-xs text-destructive">{form.formState.errors.category.message}</p> : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="blog-excerpt">{t.blog.form.excerpt}</Label>
              <Input id="blog-excerpt" {...form.register("excerpt")} placeholder={t.blog.form.excerptPlaceholder} maxLength={300} />
              {form.formState.errors.excerpt ? <p className="text-xs text-destructive">{form.formState.errors.excerpt.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="blog-content">{t.blog.form.content}</Label>
              <Textarea id="blog-content" {...form.register("content")} placeholder={t.blog.form.contentPlaceholder} rows={10} className="min-h-[220px]" />
              {form.formState.errors.content ? <p className="text-xs text-destructive">{form.formState.errors.content.message}</p> : null}
            </div>

            <ImageField label={t.blog.form.coverImage} value={watched.coverImageUrl ?? ""} onChange={(url) => form.setValue("coverImageUrl", url)} />

            {isTransformation ? (
              <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 md:grid-cols-2">
                <ImageField label={t.blog.form.beforeImage} value={watched.beforeImageUrl ?? ""} onChange={(url) => form.setValue("beforeImageUrl", url)} />
                <ImageField label={t.blog.form.afterImage} value={watched.afterImageUrl ?? ""} onChange={(url) => form.setValue("afterImageUrl", url)} />
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="blog-client-name">{t.blog.form.clientDisplayName}</Label>
                  <Input id="blog-client-name" {...form.register("clientDisplayName")} placeholder={t.blog.form.clientDisplayNamePlaceholder} maxLength={80} />
                </div>
                {form.formState.errors.beforeImageUrl || form.formState.errors.afterImageUrl ? (
                  <p className="text-xs text-destructive md:col-span-2">
                    {form.formState.errors.beforeImageUrl?.message ?? form.formState.errors.afterImageUrl?.message}
                  </p>
                ) : null}
              </div>
            ) : null}

            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <Checkbox checked={watched.published ?? false} onCheckedChange={(v) => form.setValue("published", v === true)} />
              {t.blog.form.publishNow}
            </label>

            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {isEdit ? t.blog.form.update : t.blog.form.save}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/blog")}>
                {t.common.cancel}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
