/**
 * Media validation helpers (pure — safe to unit test).
 *
 * Storage model matches the existing payment-proof pattern: the database
 * holds a reference (data URL) and never serves files publicly — media is
 * only rendered inside authenticated pages. No object storage is configured
 * in this project; migrate `storageUrl` to object-storage keys when one is
 * adopted (the column already holds opaque references).
 */

export const MAX_PHOTO_BYTES = 4 * 1024 * 1024
export const MAX_VIDEO_BYTES = 20 * 1024 * 1024

export type SniffedMedia =
  | { kind: "photo"; mime: "image/png" | "image/jpeg" | "image/webp" }
  | { kind: "video"; mime: "video/mp4" | "video/webm" }

/** Server-side MIME sniff. Never trust client-provided type/filename. */
export function sniffMedia(buf: Buffer): SniffedMedia | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { kind: "photo", mime: "image/png" }
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { kind: "photo", mime: "image/jpeg" }
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { kind: "photo", mime: "image/webp" }
  }
  // MP4/MOV: "ftyp" box at offset 4.
  if (buf.length >= 12 && buf.toString("ascii", 4, 8) === "ftyp") {
    return { kind: "video", mime: "video/mp4" }
  }
  // WebM/Matroska: EBML header 0x1A45DFA3.
  if (
    buf.length >= 4 &&
    buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3
  ) {
    return { kind: "video", mime: "video/webm" }
  }
  return null
}

export function maxBytesFor(kind: "photo" | "video"): number {
  return kind === "photo" ? MAX_PHOTO_BYTES : MAX_VIDEO_BYTES
}
