import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { MAX_PHOTO_BYTES, MAX_VIDEO_BYTES, maxBytesFor, sniffMedia } from "../src/lib/media"

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
const webp = Buffer.concat([Buffer.from("RIFF", "ascii"), Buffer.alloc(4), Buffer.from("WEBP", "ascii")])
const mp4 = Buffer.concat([Buffer.alloc(4), Buffer.from("ftyp", "ascii"), Buffer.from("isom", "ascii")])
const webm = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x00])
const garbage = Buffer.from("hello world, definitely not media")

describe("sniffMedia", () => {
  it("detects photos by magic bytes", () => {
    assert.deepEqual(sniffMedia(png), { kind: "photo", mime: "image/png" })
    assert.deepEqual(sniffMedia(jpeg), { kind: "photo", mime: "image/jpeg" })
    assert.deepEqual(sniffMedia(webp), { kind: "photo", mime: "image/webp" })
  })

  it("detects videos by magic bytes", () => {
    assert.deepEqual(sniffMedia(mp4), { kind: "video", mime: "video/mp4" })
    assert.deepEqual(sniffMedia(webm), { kind: "video", mime: "video/webm" })
  })

  it("rejects non-media and truncated buffers", () => {
    assert.equal(sniffMedia(garbage), null)
    assert.equal(sniffMedia(Buffer.alloc(0)), null)
    assert.equal(sniffMedia(Buffer.from([0xff, 0xd8])), null)
  })
})

describe("maxBytesFor", () => {
  it("caps photos lower than videos", () => {
    assert.equal(maxBytesFor("photo"), MAX_PHOTO_BYTES)
    assert.equal(maxBytesFor("video"), MAX_VIDEO_BYTES)
    assert.ok(MAX_PHOTO_BYTES < MAX_VIDEO_BYTES)
  })
})
