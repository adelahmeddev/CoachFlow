import { z } from "zod"
import { PostCategory } from "@/lib/db/enums"

export const blogPostSchema = z
  .object({
    category: z.nativeEnum(PostCategory, { message: "CATEGORY_INVALID" }),
    title: z.string().trim().min(3, "TITLE_MIN").max(160, "TITLE_MAX"),
    excerpt: z.string().trim().max(300, "EXCERPT_MAX").nullable().optional(),
    content: z.string().trim().min(10, "CONTENT_MIN").max(20000, "CONTENT_MAX"),
    coverImageUrl: z.string().trim().max(2048).nullable().optional(),
    beforeImageUrl: z.string().trim().max(2048).nullable().optional(),
    afterImageUrl: z.string().trim().max(2048).nullable().optional(),
    clientDisplayName: z.string().trim().max(80).nullable().optional(),
    published: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.category === PostCategory.TRANSFORMATION) {
      if (!data.beforeImageUrl) {
        ctx.addIssue({ code: "custom", path: ["beforeImageUrl"], message: "BEFORE_REQUIRED" })
      }
      if (!data.afterImageUrl) {
        ctx.addIssue({ code: "custom", path: ["afterImageUrl"], message: "AFTER_REQUIRED" })
      }
    }
  })

export type BlogPostInput = z.infer<typeof blogPostSchema>
