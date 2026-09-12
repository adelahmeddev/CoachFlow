"use client"

/**
 * Shared picked-file normalization for the Settings image editors.
 *
 * Phone photos are stored unrotated with an EXIF orientation flag: <img>
 * honors it but canvas crops raw pixels, so without normalization the
 * saved image comes out rotated vs. the editor preview. Decoding with
 * imageOrientation 'from-image' bakes the orientation into the pixels the
 * editor works on. Falls back to the raw file on any failure.
 */
export async function normalizePickedImage(f: File): Promise<string> {
  try {
    const bmp = await createImageBitmap(f, { imageOrientation: "from-image" })
    try {
      const c = document.createElement("canvas")
      c.width = bmp.width
      c.height = bmp.height
      c.getContext("2d")?.drawImage(bmp, 0, 0)
      const blob = await new Promise<Blob | null>((resolve) => c.toBlob(resolve, "image/png"))
      if (blob) return URL.createObjectURL(blob)
    } finally {
      bmp.close()
    }
  } catch {
    // fall through to raw file
  }
  return URL.createObjectURL(f)
}
