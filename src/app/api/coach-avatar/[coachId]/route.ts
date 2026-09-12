import { pool } from "@/lib/db"

export const runtime = "nodejs"
// Versioned URLs (?v=<ts>) are written on every upload, so files are immutable.
export const dynamic = "force-dynamic"

/** Public coach personal photo bytes. No auth — the avatar renders on the
 *  client home hero. CoachAvatarFile rows are tiny WebPs. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ coachId: string }> }
) {
  const { coachId } = await ctx.params
  if (!coachId || coachId.length > 64) {
    return new Response("Not found", { status: 404 })
  }
  const res = await pool.query(
    `SELECT "bytes", "contentType", "byteSize" FROM "CoachAvatarFile" WHERE "coachId" = $1 LIMIT 1`,
    [coachId]
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
