/**
 * One-time migration script to move binary media (CoachLogoFile, PostImageFile)
 * from PostgreSQL BYTEA columns to Cloudflare R2 / AWS S3 Object Storage.
 *
 * Usage:
 *   npx tsx scripts/migrate-media-to-storage.ts
 */

import dotenv from "dotenv"
dotenv.config()

import { pool } from "../src/lib/db"
import { isStorageConfigured, uploadBufferToStorage } from "../src/lib/storage"

async function main() {
  console.log("==> CoachFlow Media Migration: Postgres BYTEA -> Object Storage")

  if (!isStorageConfigured()) {
    console.error(`
[ERROR] Object Storage is not configured.
Please configure the following environment variables in .env:
  S3_ENDPOINT (or R2_ENDPOINT)
  S3_BUCKET (or R2_BUCKET)
  S3_ACCESS_KEY_ID
  S3_SECRET_ACCESS_KEY
  S3_PUBLIC_URL (optional custom CDN domain)
`)
    process.exit(1)
  }

  // 1. Migrate CoachLogoFile
  console.log("==> Fetching CoachLogoFile records...")
  const logosRes = await pool.query<{ coachId: string; bytes: Buffer; contentType: string }>(
    `SELECT "coachId", "bytes", "contentType" FROM "CoachLogoFile"`
  )
  console.log(`Found ${logosRes.rows.length} coach logos to migrate.`)

  let migratedLogos = 0
  for (const row of logosRes.rows) {
    const key = `logos/${row.coachId}.webp`
    try {
      const { publicUrl } = await uploadBufferToStorage(key, row.bytes, row.contentType || "image/webp")
      await pool.query(
        `UPDATE "TrainerProfile" SET "logoUrl" = $1, "updatedAt" = NOW() WHERE "id" = $2`,
        [publicUrl, row.coachId]
      )
      migratedLogos++
      console.log(`  [✓] Logo migrated for coach ${row.coachId} -> ${publicUrl}`)
    } catch (err) {
      console.error(`  [✗] Failed to migrate logo for coach ${row.coachId}:`, err)
    }
  }

  // 2. Migrate PostImageFile
  console.log("\n==> Fetching PostImageFile records...")
  const postsRes = await pool.query<{ id: string; postId: string; bytes: Buffer; contentType: string }>(
    `SELECT "id", "postId", "bytes", "contentType" FROM "PostImageFile"`
  )
  console.log(`Found ${postsRes.rows.length} post images to migrate.`)

  let migratedPosts = 0
  for (const row of postsRes.rows) {
    const key = `blog/${row.postId}/${row.id}.webp`
    try {
      const { publicUrl } = await uploadBufferToStorage(key, row.bytes, row.contentType || "image/webp")
      // Update any BlogPost records referencing this old /api/blog-image endpoint
      await pool.query(
        `UPDATE "BlogPost"
         SET "coverImageUrl" = CASE WHEN "coverImageUrl" LIKE '%' || $1 || '%' THEN $2 ELSE "coverImageUrl" END,
             "beforeImageUrl" = CASE WHEN "beforeImageUrl" LIKE '%' || $1 || '%' THEN $2 ELSE "beforeImageUrl" END,
             "afterImageUrl" = CASE WHEN "afterImageUrl" LIKE '%' || $1 || '%' THEN $2 ELSE "afterImageUrl" END
         WHERE "id" = $3`,
        [row.id, publicUrl, row.postId]
      )
      migratedPosts++
      console.log(`  [✓] Image ${row.id} migrated for post ${row.postId} -> ${publicUrl}`)
    } catch (err) {
      console.error(`  [✗] Failed to migrate image ${row.id}:`, err)
    }
  }

  console.log("\n==> Migration Summary:")
  console.log(`  Logos migrated: ${migratedLogos}/${logosRes.rows.length}`)
  console.log(`  Post images migrated: ${migratedPosts}/${postsRes.rows.length}`)
  console.log("\nMigration completed successfully. Old BYTEA tables are preserved for verification.")
  await pool.end()
}

main().catch((err) => {
  console.error("Migration script failed:", err)
  process.exit(1)
})
