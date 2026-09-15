import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { logger } from "@/lib/logger"

let s3Client: S3Client | null = null

function getClient(): S3Client | null {
  if (s3Client) return s3Client

  const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT
  const region = process.env.S3_REGION || "auto"
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    return null
  }

  try {
    s3Client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // Cloudflare R2 / MinIO require path style or virtual host depending on endpoint
      forcePathStyle: !endpoint?.includes("amazonaws.com"),
    })
    return s3Client
  } catch (err) {
    logger.error("[storage] Failed to initialize S3/R2 client", err)
    return null
  }
}

export function isStorageConfigured(): boolean {
  return getClient() !== null && !!(process.env.S3_BUCKET || process.env.R2_BUCKET)
}

function getBucketName(): string {
  const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET
  if (!bucket) {
    throw new Error("S3_BUCKET or R2_BUCKET is not set in environment")
  }
  return bucket
}

export function getPublicUrl(key: string): string {
  const customDomain = process.env.S3_PUBLIC_URL || process.env.R2_PUBLIC_URL || process.env.MEDIA_CDN_URL
  if (customDomain) {
    const trimmed = customDomain.replace(/\/+$/, "")
    return `${trimmed}/${key.replace(/^\/+/, "")}`
  }
  const bucket = getBucketName()
  const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT
  if (endpoint) {
    return `${endpoint.replace(/\/+$/, "")}/${bucket}/${key.replace(/^\/+/, "")}`
  }
  return `https://${bucket}.s3.amazonaws.com/${key.replace(/^\/+/, "")}`
}

export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 300
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const client = getClient()
  if (!client) {
    throw new Error("Object storage (S3/R2) is not configured")
  }

  const bucket = getBucketName()
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds })
  const publicUrl = getPublicUrl(key)

  return { uploadUrl, publicUrl, key }
}

export async function uploadBufferToStorage(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<{ publicUrl: string; key: string }> {
  const client = getClient()
  if (!client) {
    throw new Error("Object storage (S3/R2) is not configured")
  }

  const bucket = getBucketName()
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )

  return {
    publicUrl: getPublicUrl(key),
    key,
  }
}

export async function deleteFromStorage(key: string): Promise<void> {
  const client = getClient()
  if (!client) return

  try {
    const bucket = getBucketName()
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )
  } catch (err) {
    logger.error(`[storage] Failed to delete key ${key} from storage`, err)
  }
}
