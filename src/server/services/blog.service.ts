import { pool, generateId } from "@/lib/db"
import type { CoachPost } from "@/lib/db/types"
import { PostCategory } from "@/lib/db/enums"

export const BLOG_CATEGORIES = Object.values(PostCategory)

const POST_COLS = `"id","coachId","category","title","excerpt","content","coverImageUrl","beforeImageUrl","afterImageUrl","clientDisplayName","published","publishedAt","createdAt","updatedAt"`

type PostRow = CoachPost

/** Extract a /api/post-image/<id> file id from a stored URL (for cleanup). */
export function postImageIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const m = /^\/api\/post-image\/([A-Za-z0-9_-]{1,64})/.exec(url.trim())
  return m ? m[1]! : null
}

async function deletePostImageRow(imageId: string, coachId: string) {
  await pool.query(`DELETE FROM "PostImageFile" WHERE "id"=$1 AND "coachId"=$2`, [imageId, coachId])
}

/** Delete orphaned image rows after an image field was replaced or cleared. */
export async function pruneReplacedImages(
  coachId: string,
  oldUrls: Array<string | null | undefined>,
  newUrls: Array<string | null | undefined>
) {
  const kept = new Set(newUrls.filter(Boolean) as string[])
  for (const url of oldUrls) {
    const id = postImageIdFromUrl(url)
    if (id && !kept.has(url as string)) {
      await deletePostImageRow(id, coachId)
    }
  }
}

// ---------- Coach management (own posts only) ----------

export async function listCoachPosts(coachId: string): Promise<PostRow[]> {
  const res = await pool.query<PostRow>(
    `SELECT ${POST_COLS} FROM "CoachPost" WHERE "coachId"=$1 ORDER BY "createdAt" DESC`,
    [coachId]
  )
  return res.rows as PostRow[]
}

export async function getCoachPost(coachId: string, postId: string): Promise<PostRow | null> {
  const res = await pool.query<PostRow>(
    `SELECT ${POST_COLS} FROM "CoachPost" WHERE "id"=$1 AND "coachId"=$2 LIMIT 1`,
    [postId, coachId]
  )
  return (res.rows[0] as PostRow | undefined) ?? null
}

export async function createCoachPost(
  coachId: string,
  input: {
    category: PostCategory
    title: string
    excerpt?: string | null
    content: string
    coverImageUrl?: string | null
    beforeImageUrl?: string | null
    afterImageUrl?: string | null
    clientDisplayName?: string | null
    published?: boolean
  }
): Promise<PostRow> {
  const published = input.published ?? false
  const res = await pool.query<PostRow>(
    `INSERT INTO "CoachPost" ("id","coachId","category","title","excerpt","content","coverImageUrl","beforeImageUrl","afterImageUrl","clientDisplayName","published","publishedAt","createdAt","updatedAt")
     VALUES ($1,$2,$3::"PostCategory",$4,$5,$6,$7,$8,$9,$10,$11,CASE WHEN $11 THEN NOW() ELSE NULL END,NOW(),NOW())
     RETURNING ${POST_COLS}`,
    [
      generateId(),
      coachId,
      input.category,
      input.title,
      input.excerpt || null,
      input.content,
      input.coverImageUrl || null,
      input.beforeImageUrl || null,
      input.afterImageUrl || null,
      input.clientDisplayName || null,
      published,
    ]
  )
  return res.rows[0] as PostRow
}

export async function updateCoachPost(
  coachId: string,
  postId: string,
  input: {
    category: PostCategory
    title: string
    excerpt?: string | null
    content: string
    coverImageUrl?: string | null
    beforeImageUrl?: string | null
    afterImageUrl?: string | null
    clientDisplayName?: string | null
    published?: boolean
  }
): Promise<PostRow | null> {
  const prev = await getCoachPost(coachId, postId)
  if (!prev) return null
  const published = input.published ?? prev.published
  const res = await pool.query<PostRow>(
    `UPDATE "CoachPost"
     SET "category"=$3::"PostCategory","title"=$4,"excerpt"=$5,"content"=$6,
         "coverImageUrl"=$7,"beforeImageUrl"=$8,"afterImageUrl"=$9,"clientDisplayName"=$10,
         "published"=$11,
         "publishedAt"=CASE WHEN $11 AND "publishedAt" IS NULL THEN NOW() WHEN NOT $11 THEN NULL ELSE "publishedAt" END,
         "updatedAt"=NOW()
     WHERE "id"=$1 AND "coachId"=$2
     RETURNING ${POST_COLS}`,
    [
      postId,
      coachId,
      input.category,
      input.title,
      input.excerpt || null,
      input.content,
      input.coverImageUrl || null,
      input.beforeImageUrl || null,
      input.afterImageUrl || null,
      input.clientDisplayName || null,
      published,
    ]
  )
  const updated = (res.rows[0] as PostRow | undefined) ?? null
  if (updated) {
    await pruneReplacedImages(
      coachId,
      [prev.coverImageUrl, prev.beforeImageUrl, prev.afterImageUrl],
      [updated.coverImageUrl, updated.beforeImageUrl, updated.afterImageUrl]
    )
  }
  return updated
}

export async function setPostPublished(coachId: string, postId: string, published: boolean): Promise<PostRow | null> {
  const res = await pool.query<PostRow>(
    `UPDATE "CoachPost"
     SET "published"=$3,
         "publishedAt"=CASE WHEN $3 AND "publishedAt" IS NULL THEN NOW() WHEN NOT $3 THEN NULL ELSE "publishedAt" END,
         "updatedAt"=NOW()
     WHERE "id"=$1 AND "coachId"=$2
     RETURNING ${POST_COLS}`,
    [postId, coachId, published]
  )
  return (res.rows[0] as PostRow | undefined) ?? null
}

export async function deleteCoachPost(coachId: string, postId: string): Promise<boolean> {
  const prev = await getCoachPost(coachId, postId)
  if (!prev) return false
  await pool.query(`DELETE FROM "CoachPost" WHERE "id"=$1 AND "coachId"=$2`, [postId, coachId])
  await pruneReplacedImages(
    coachId,
    [prev.coverImageUrl, prev.beforeImageUrl, prev.afterImageUrl],
    []
  )
  return true
}

// ---------- Client visibility (published only, own coach only) ----------

async function trainerIdForClient(clientId: string): Promise<string | null> {
  const res = await pool.query<{ trainerId: string }>(
    `SELECT "trainerId" FROM "Client" WHERE "id"=$1 LIMIT 1`,
    [clientId]
  )
  return res.rows[0]?.trainerId ?? null
}

/** Published posts for a client's own coach — never global, never drafts. */
export async function listPublishedPostsForClient(
  clientId: string,
  limit = 6
): Promise<{ coachId: string | null; posts: PostRow[] }> {
  const trainerId = await trainerIdForClient(clientId)
  if (!trainerId) return { coachId: null, posts: [] }
  const res = await pool.query<PostRow>(
    `SELECT ${POST_COLS} FROM "CoachPost"
     WHERE "coachId"=$1 AND "published"=true
     ORDER BY COALESCE("publishedAt","createdAt") DESC LIMIT $2`,
    [trainerId, Math.min(Math.max(limit, 1), 20)]
  )
  return { coachId: trainerId, posts: res.rows as PostRow[] }
}

/** Single published post — verified against the reader's own coach. */
export async function getPublishedPostForClient(
  clientId: string,
  postId: string
): Promise<{ coachId: string; post: PostRow } | null> {
  const trainerId = await trainerIdForClient(clientId)
  if (!trainerId) return null
  const res = await pool.query<PostRow>(
    `SELECT ${POST_COLS} FROM "CoachPost"
     WHERE "id"=$1 AND "coachId"=$2 AND "published"=true LIMIT 1`,
    [postId, trainerId]
  )
  const post = (res.rows[0] as PostRow | undefined) ?? null
  return post ? { coachId: trainerId, post } : null
}

// ---------- Image file storage (WebP bytes, URL-only references) ----------

export async function storePostImage(
  coachId: string,
  bytes: Buffer
): Promise<{ id: string; url: string; byteSize: number }> {
  const id = generateId()
  await pool.query(
    `INSERT INTO "PostImageFile" ("id","coachId","bytes","contentType","byteSize","createdAt")
     VALUES ($1,$2,$3,'image/webp',$4,NOW())`,
    [id, coachId, bytes, bytes.length]
  )
  return { id, url: `/api/post-image/${id}?v=${Date.now()}`, byteSize: bytes.length }
}
