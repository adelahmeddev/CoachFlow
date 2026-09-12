import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { blogPostSchema } from "../src/lib/validations/blog"
import { postImageIdFromUrl } from "../src/server/services/blog.service"
import { BLOG_CATEGORIES } from "../src/server/services/blog.service"
import { BLOG_MAX_DIM, BLOG_WEBP_QUALITY, BLOG_MAX_INPUT_BYTES } from "../src/lib/logo-image"

const base = {
  category: "GENERAL",
  title: "Five protein mistakes beginners make",
  excerpt: "Short version",
  content: "This is the full post content with enough length.",
  published: true,
}

describe("blogPostSchema", () => {
  it("accepts a normal published post", () => {
    const r = blogPostSchema.safeParse(base)
    assert.equal(r.success, true)
  })

  it("accepts drafts with defaults", () => {
    const r = blogPostSchema.safeParse({ ...base, published: false })
    assert.equal(r.success, true)
    if (r.success) assert.equal(r.data.published, false)
  })

  it("accepts nulls for optional fields (form empty-string mapping)", () => {
    const r = blogPostSchema.safeParse({
      ...base,
      category: "TRANSFORMATION",
      excerpt: null,
      coverImageUrl: null,
      beforeImageUrl: "/api/post-image/a?v=1",
      afterImageUrl: "/api/post-image/b?v=1",
      clientDisplayName: null,
    })
    assert.equal(r.success, true)
  })

  it("requires before/after images for transformations", () => {
    const missing = blogPostSchema.safeParse({ ...base, category: "TRANSFORMATION" })
    assert.equal(missing.success, false)
    const full = blogPostSchema.safeParse({
      ...base,
      category: "TRANSFORMATION",
      beforeImageUrl: "/api/post-image/a?v=1",
      afterImageUrl: "/api/post-image/b?v=1",
    })
    assert.equal(full.success, true)
  })

  it("rejects short titles, short content, and bad categories", () => {
    assert.equal(blogPostSchema.safeParse({ ...base, title: "Hi" }).success, false)
    assert.equal(blogPostSchema.safeParse({ ...base, content: "short" }).success, false)
    assert.equal(blogPostSchema.safeParse({ ...base, category: "NOPE" }).success, false)
  })

  it("exposes the six required categories", () => {
    assert.deepEqual([...BLOG_CATEGORIES].sort(), ["EDUCATION", "GENERAL", "NUTRITION", "TIPS", "TRAINING", "TRANSFORMATION"].sort())
  })
})

describe("postImageIdFromUrl", () => {
  it("extracts file ids for orphan cleanup", () => {
    assert.equal(postImageIdFromUrl("/api/post-image/cabc123?v=1780000000000"), "cabc123")
    assert.equal(postImageIdFromUrl(null), null)
    assert.equal(postImageIdFromUrl("data:image/png;base64,xx"), null)
    assert.equal(postImageIdFromUrl("https://cdn.example.com/x.png"), null)
  })
})

describe("blog image budget", () => {
  it("uses larger-but-bounded dimensions vs logos", () => {
    assert.ok(BLOG_MAX_DIM <= 1280 && BLOG_MAX_DIM > 512)
    assert.ok(BLOG_WEBP_QUALITY >= 70 && BLOG_WEBP_QUALITY <= 85)
    assert.equal(BLOG_MAX_INPUT_BYTES, 8 * 1024 * 1024)
  })
})
