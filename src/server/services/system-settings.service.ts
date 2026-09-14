import { pool, generateId } from "@/lib/db"
import type { WhatsAppTemplatesInput } from "@/lib/validations/admin"

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplatesInput = {
  reminderTemplate:
    "أهلاً كوتش {coach_name}، بنفكرك إن اشتراكك في منصة CoachFlow ينتهي خلال {days_left} يوم (بتاريخ {end_date}). لتجديد اشتراكك وضمان استمرار الخدمة لمتدربيك، يسعدنا تواصلك معنا.",
  followupTemplate:
    "أهلاً كوتش {coach_name}، بنتمنى تكون بأفضل حال. حابين نطمن على متابعتك لمتدربيك على CoachFlow ونعرف لو محتاج أي دعم بخصوص باقتك الحالية.",
}

const WHATSAPP_SETTINGS_KEY = "admin_whatsapp_templates"

let missingTableWarned = false
let ensureTablePromise: Promise<void> | null = null

/**
 * Self-healing DDL: the migration pipeline in this repo cannot be relied on
 * (broken shadow-DB validation, drifted local history), so the settings
 * store creates its own table on first use. Idempotent and race-safe enough
 * for admin-only traffic via IF NOT EXISTS.
 */
function ensureSystemSettingTable(): Promise<void> {
  if (!ensureTablePromise) {
    ensureTablePromise = pool
      .query(
        `CREATE TABLE IF NOT EXISTS "SystemSetting" (
          "id" TEXT NOT NULL,
          "key" TEXT NOT NULL,
          "value" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
        )`
      )
      .then(() =>
        pool.query(
          `CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_key_key" ON "SystemSetting"("key")`
        )
      )
      .then(() => undefined)
      .catch((error) => {
        // Reset so a later call retries; callers fall back to defaults.
        ensureTablePromise = null
        throw error
      })
  }
  return ensureTablePromise
}

export async function getWhatsAppTemplates(): Promise<WhatsAppTemplatesInput> {
  try {
    await ensureSystemSettingTable()
    const res = await pool.query(
      `SELECT "value" FROM "SystemSetting" WHERE "key" = $1 LIMIT 1`,
      [WHATSAPP_SETTINGS_KEY]
    )

    if (res.rowCount === 0) {
      return DEFAULT_WHATSAPP_TEMPLATES
    }

    const parsed = JSON.parse(res.rows[0].value) as Partial<WhatsAppTemplatesInput>
    return {
      reminderTemplate:
        parsed.reminderTemplate || DEFAULT_WHATSAPP_TEMPLATES.reminderTemplate,
      followupTemplate:
        parsed.followupTemplate || DEFAULT_WHATSAPP_TEMPLATES.followupTemplate,
    }
  } catch (error) {
    // 42P01 = table not migrated yet (e.g. production before deploy runs
    // migrations). Fall back to defaults quietly instead of log-spamming.
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "42P01"
    ) {
      if (!missingTableWarned) {
        missingTableWarned = true
        console.warn(
          "[getWhatsAppTemplates] SystemSetting table missing — using defaults until migrations run."
        )
      }
      return DEFAULT_WHATSAPP_TEMPLATES
    }
    console.error("[getWhatsAppTemplates] Error reading settings:", error)
    return DEFAULT_WHATSAPP_TEMPLATES
  }
}

export async function saveWhatsAppTemplates(
  input: WhatsAppTemplatesInput
): Promise<void> {
  await ensureSystemSettingTable()
  const jsonValue = JSON.stringify(input)
  await pool.query(
    `INSERT INTO "SystemSetting" ("id", "key", "value", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT ("key") DO UPDATE SET "value" = $3, "updatedAt" = NOW()`,
    [generateId(), WHATSAPP_SETTINGS_KEY, jsonValue]
  )
}
