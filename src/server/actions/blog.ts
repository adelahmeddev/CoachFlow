"use server"

import { revalidatePath } from "next/cache"
import { getCurrentSession } from "@/server/auth"
import { blogPostSchema } from "@/lib/validations/blog"
import { sniffImage, convertBlogToWebp, BLOG_MAX_INPUT_BYTES } from "@/lib/logo-image"
import {
  listCoachPosts,
  getCoachPost,
  createCoachPost,
  updateCoachPost,
  setPostPublished,
  deleteCoachPost,
  storePostImage,
} from "@/server/services/blog.service"

function coachId(session: Awaited<ReturnType<typeof getCurrentSession>>) {
  return session?.user.role === "COACH" ? session.user.trainerProfileId ?? null : null
}

function bust() {
  revalidatePath(`/blog`, "layout")
  revalidatePath(`/client/home`)
}

export async function listPostsAction() {
  const session = await getCurrentSession()
  const id = coachId(session)
  if (!id) return { ok: false as const, error: "UNAUTHORIZED" }
  return { ok: true as const, posts: await listCoachPosts(id) }
}

export async function getPostAction(postId: string) {
  const session = await getCurrentSession()
  const id = coachId(session)
  if (!id) return { ok: false as const, error: "UNAUTHORIZED" }
  const post = await getCoachPost(id, postId)
  if (!post) return { ok: false as const, error: "NOT_FOUND" }
  return { ok: true as const, post }
}

export async function createPostAction(input: unknown) {
  const session = await getCurrentSession()
  const id = coachId(session)
  if (!id) return { ok: false as const, error: "UNAUTHORIZED" }
  const parsed = blogPostSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: "INVALID_INPUT", fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const post = await createCoachPost(id, parsed.data)
  bust()
  return { ok: true as const, post }
}

export async function updatePostAction(postId: string, input: unknown) {
  const session = await getCurrentSession()
  const id = coachId(session)
  if (!id) return { ok: false as const, error: "UNAUTHORIZED" }
  const parsed = blogPostSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: "INVALID_INPUT", fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const post = await updateCoachPost(id, postId, parsed.data)
  if (!post) return { ok: false as const, error: "NOT_FOUND" }
  bust()
  return { ok: true as const, post }
}

export async function togglePublishAction(postId: string, published: boolean) {
  const session = await getCurrentSession()
  const id = coachId(session)
  if (!id) return { ok: false as const, error: "UNAUTHORIZED" }
  const post = await setPostPublished(id, postId, published)
  if (!post) return { ok: false as const, error: "NOT_FOUND" }
  bust()
  return { ok: true as const, post }
}

export async function deletePostAction(postId: string) {
  const session = await getCurrentSession()
  const id = coachId(session)
  if (!id) return { ok: false as const, error: "UNAUTHORIZED" }
  const deleted = await deleteCoachPost(id, postId)
  if (!deleted) return { ok: false as const, error: "NOT_FOUND" }
  bust()
  return { ok: true as const }
}

/** Upload a blog image: validate -> WebP -> file row -> short URL. Never a data URL. */
export async function uploadPostImageAction(formData: FormData) {
  const session = await getCurrentSession()
  const id = coachId(session)
  if (!id) return { ok: false as const, error: "UNAUTHORIZED" }

  const file = formData.get("file") as File | null
  if (!file || typeof file === "string" || file.size === 0) return { ok: false as const, error: "NO_FILE" }
  if (file.size > BLOG_MAX_INPUT_BYTES) return { ok: false as const, error: "TOO_LARGE" }

  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.length > BLOG_MAX_INPUT_BYTES) return { ok: false as const, error: "TOO_LARGE" }
  if (!sniffImage(buf)) return { ok: false as const, error: "INVALID_TYPE" }

  let webp: Buffer
  try {
    webp = await convertBlogToWebp(buf)
  } catch {
    return { ok: false as const, error: "INVALID_IMAGE" }
  }

  const stored = await storePostImage(id, webp)
  return { ok: true as const, url: stored.url, byteSize: stored.byteSize }
}
