import { describe, it } from "node:test"
import assert from "node:assert/strict"
import sharp from "sharp"
import {
  sniffLogo,
  convertLogoToWebp,
  LOGO_MAX_DIM,
  LOGO_MAX_INPUT_BYTES,
} from "../src/lib/logo-image"
import { sanitizeBranding } from "../src/server/services/branding.service"

describe("sniffLogo", () => {
  it("detects png, jpeg, webp, svg and rejects garbage", async () => {
    const png = await sharp({ create: { width: 8, height: 8, channels: 4, background: { r: 1, g: 2, b: 3, alpha: 1 } } }).png().toBuffer()
    const jpeg = await sharp({ create: { width: 8, height: 8, channels: 3, background: { r: 1, g: 2, b: 3 } } }).jpeg().toBuffer()
    const webp = await sharp({ create: { width: 8, height: 8, channels: 3, background: { r: 1, g: 2, b: 3 } } }).webp().toBuffer()
    assert.equal(sniffLogo(png), "image/png")
    assert.equal(sniffLogo(jpeg), "image/jpeg")
    assert.equal(sniffLogo(webp), "image/webp")
    assert.equal(
      sniffLogo(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="8" height="8"/></svg>')),
      "image/svg+xml"
    )
    assert.equal(sniffLogo(Buffer.from("not an image at all........")), null)
    assert.equal(sniffLogo(Buffer.alloc(0)), null)
  })
})

describe("convertLogoToWebp", () => {
  it("caps dimensions, keeps alpha, and shrinks aggressively", async () => {
    const big = await sharp({
      create: { width: 1600, height: 1200, channels: 4, background: { r: 200, g: 50, b: 50, alpha: 0.6 } },
    }).png().toBuffer()
    const out = await convertLogoToWebp(big)
    const meta = await sharp(out).metadata()
    assert.equal(meta.format, "webp")
    assert.ok((meta.width ?? 0) <= LOGO_MAX_DIM && (meta.height ?? 0) <= LOGO_MAX_DIM)
    assert.equal(meta.width, LOGO_MAX_DIM) // 1600x1200 -> 512x384
    assert.equal(meta.height, 384)
    assert.equal(meta.hasAlpha, true)
    assert.ok(out.length < big.length, `expected shrink, got ${out.length} vs ${big.length}`)
    console.log(`logo compression: ${big.length}B png -> ${out.length}B webp`)
  })

  it("does not enlarge small logos", async () => {
    const small = await sharp({ create: { width: 64, height: 64, channels: 3, background: { r: 1, g: 2, b: 3 } } }).png().toBuffer()
    const meta = await sharp(await convertLogoToWebp(small)).metadata()
    assert.equal(meta.width, 64)
    assert.equal(meta.height, 64)
  })

  it("rejects corrupt input", async () => {
    await assert.rejects(() => convertLogoToWebp(Buffer.from("garbage-bytes-here-1234567890")))
  })

  it("input cap is 2MB", () => {
    assert.equal(LOGO_MAX_INPUT_BYTES, 2 * 1024 * 1024)
  })
})

describe("branding accepts file URLs", () => {
  it("stores /api/coach-logo versioned URLs as-is", () => {
    const url = "/api/coach-logo/cabc123?v=1780000000000"
    assert.equal(sanitizeBranding({ logoUrl: url }).logoUrl, url)
  })
})
