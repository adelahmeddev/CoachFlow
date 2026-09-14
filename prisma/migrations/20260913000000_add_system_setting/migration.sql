-- Generic key-value store for administrative configuration
-- (e.g. WhatsApp subscription reminder / follow-up templates).
CREATE TABLE IF NOT EXISTS "SystemSetting" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_key_key" ON "SystemSetting"("key");
CREATE INDEX IF NOT EXISTS "SystemSetting_key_idx" ON "SystemSetting"("key");
