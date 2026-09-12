import { pool } from "@/lib/db"

export const runtime = "nodejs"
// Versioned URLs (?v=<ts>) are written on upload, so files are immutable.
export const dynamic = "force-dynamic"

/** Public blog image bytes. No auth — published posts render inside the
 *  client portal. Draft images are unguessable cuid URLs. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ imageId: string }> }
) {
  const { imageId } = await ctx.params
  if (!imageId || imageId.length > 64) {
    return new Response("Not found", { status: 404 })
  }
  const res = await pool.query(
    `SELECT "bytes", "contentType", "byteSize" FROM "PostImageFile" WHERE "id" = $1 LIMIT 1`,
    [imageId]
  )
  const row = res.rows[0] as
    | { bytes: Buffer; contentType: string; byteSize: number }
    | undefined
  if (!row) return new Response("Not found", { status: 404 })
  return new Response(new Uint8Array(row.bytes), {
    headers: {
      "Content-Type": row.contentType || "image/webp",
      "Content-Length": String(row.byteSize),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
