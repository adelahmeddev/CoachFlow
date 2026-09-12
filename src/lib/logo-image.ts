/**
 * Shared image pipeline (pure helpers + sharp conversion).
 *
 * Flow: sniff magic bytes -> reject oversize BEFORE processing ->
 * sharp resize (inside maxDim, never enlarge) -> WebP.
 * sharp strips metadata by default and preserves alpha.
 *
 * Coach logos use the LOGO_* presets (512px, tiny files); blog covers and
 * transformation photos use the BLOG_* presets (larger, still compressed).
 */

export const LOGO_MAX_INPUT_BYTES = 2 * 1024 * 1024
export const LOGO_MAX_DIM = 512
export const LOGO_WEBP_QUALITY = 75

export const BLOG_MAX_INPUT_BYTES = 8 * 1024 * 1024
export const BLOG_MAX_DIM = 1280
export const BLOG_WEBP_QUALITY = 80

export type ImageMime = "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml"
/** @deprecated Use ImageMime — kept for existing logo imports. */
export type LogoMime = ImageMime

/** Server-side MIME sniff. Never trust client-provided type/filename. */
export function sniffImage(buf: Buffer): ImageMime | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "image/png"
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg"
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp"
  }
  const head = buf.toString("utf8", 0, Math.min(buf.length, 512))
  if (head.includes("<svg")) {
    return "image/svg+xml"
  }
  return null
}

/** @deprecated Use sniffImage — kept for existing logo imports. */
export const sniffLogo = sniffImage

/** Convert any accepted image to a small WebP. Throws on corrupt input. */
export async function convertToWebp(
  buf: Buffer,
  opts: { maxDim?: number; quality?: number } = {}
): Promise<Buffer> {
  const { maxDim = LOGO_MAX_DIM, quality = LOGO_WEBP_QUALITY } = opts
  const sharp = (await import("sharp")).default
  return sharp(buf, { limitInputPixels: 25_000_000 })
    // Auto-orient from EXIF: phone photos are stored unrotated with an
    // orientation flag that <img> honors but raw pipelines don't. Without
    // this the stored file comes out sideways vs. the editor preview.
    .rotate()
    .resize({
      width: maxDim,
      height: maxDim,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 6 })
    .toBuffer()
}

/** Convert any accepted logo to a small WebP. Throws on corrupt input. */
export async function convertLogoToWebp(buf: Buffer): Promise<Buffer> {
  return convertToWebp(buf)
}

/** Convert a blog/cover photo to a compressed WebP. Throws on corrupt input. */
export async function convertBlogToWebp(buf: Buffer): Promise<Buffer> {
  return convertToWebp(buf, { maxDim: BLOG_MAX_DIM, quality: BLOG_WEBP_QUALITY })
}
