import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  sanitizeBranding,
  isValidPrimaryColor,
  toBranding,
  DEFAULT_BRANDING,
} from "../src/server/services/branding.service"
import { buildBrandScale, buildBrandingVars } from "../src/components/branding/branding-provider"

describe("isValidPrimaryColor", () => {
  it("accepts 6-digit hex and null", () => {
    assert.equal(isValidPrimaryColor("#2563EB"), true)
    assert.equal(isValidPrimaryColor("#e85d04"), true)
    assert.equal(isValidPrimaryColor(null), true)
  })

  it("rejects non-hex, short hex, and injection", () => {
    assert.equal(isValidPrimaryColor("red"), false)
    assert.equal(isValidPrimaryColor("#FFF"), false)
    assert.equal(isValidPrimaryColor("javascript:alert(1)"), false)
    assert.equal(isValidPrimaryColor("#123456 url(x)"), false)
  })
})

describe("sanitizeBranding logo handling", () => {
  it("preserves data-URL logos without truncation (refresh bug)", () => {
    // Simulate a small png data URL and verify byte-for-byte preservation
    const payload = Buffer.alloc(5000, 7).toString("base64")
    const dataUrl = `data:image/png;base64,${payload}`
    const out = sanitizeBranding({ logoUrl: dataUrl })
    assert.equal(out.logoUrl, dataUrl)
  })

  it("rejects oversized data URLs instead of truncating", () => {
    const payload = Buffer.alloc(3_600_000, 7).toString("base64")
    const dataUrl = `data:image/png;base64,${payload}`
    assert.throws(() => sanitizeBranding({ logoUrl: dataUrl }), /INVALID_LOGO/)
  })

  it("rejects non-image data URLs", () => {
    assert.throws(
      () => sanitizeBranding({ logoUrl: "data:text/html;base64,PGI+" }),
      /INVALID_LOGO/
    )
  })

  it("keeps short http(s) URLs and rejects overlong ones", () => {
    const ok = sanitizeBranding({ logoUrl: "https://cdn.example.com/logo.png" })
    assert.equal(ok.logoUrl, "https://cdn.example.com/logo.png")
    assert.throws(
      () => sanitizeBranding({ logoUrl: `https://x.example/${"a".repeat(2100)}` }),
      /INVALID_LOGO/
    )
  })

  it("rejects javascript: URLs", () => {
    const out = sanitizeBranding({ logoUrl: "javascript:alert(1)" })
    assert.equal(out.logoUrl, null)
  })
})

describe("toBranding", () => {
  it("falls back to defaults without a row or coach", () => {
    assert.deepEqual(toBranding(null, "coach-1"), {
      ...DEFAULT_BRANDING,
      coachId: "coach-1",
    })
    assert.deepEqual(toBranding(null, null), {
      ...DEFAULT_BRANDING,
      coachId: null,
    })
  })

  it("maps effective values with the given coachId (isolation)", () => {
    const out = toBranding(
      { effective: { brandName: "A", logoUrl: "L", primaryColor: "#111111" } },
      "coach-A"
    )
    assert.equal(out.coachId, "coach-A")
    assert.equal(out.brandName, "A")
    assert.equal(out.primaryColor, "#111111")
  })
})

describe("buildBrandScale / buildBrandingVars", () => {
  it("derives the full 50-900 scale anchored at primary", () => {
    const scale = buildBrandScale("#2563EB")
    assert.equal(scale[500], "#2563EB")
    for (const step of [50, 100, 200, 300, 400, 600, 700, 800, 900] as const) {
      assert.match(scale[step], /^#[0-9a-f]{6}$/i)
      assert.notEqual(scale[step], "#E85D04")
    }
  })

  it("falls back to default primary on invalid input", () => {
    assert.equal(buildBrandScale("not-a-color")[500], "#961112")
  })

  it("covers every var the UI reads (no undefined steps)", () => {
    const vars = buildBrandingVars("#2563EB")
    for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
      assert.ok(vars[`--color-brand-${step}`], `missing --color-brand-${step}`)
      assert.ok(vars[`--brand-${step}`], `missing --brand-${step}`)
    }
    for (const k of [
      "--primary",
      "--primary-foreground",
      "--ring",
      "--chart-1",
      "--sidebar-primary",
      "--msg-bubble-own-bg",
    ]) {
      assert.ok(vars[k], `missing ${k}`)
    }
  })
})
