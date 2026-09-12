-- Add coach social profile links. These columns were declared in
-- schema.prisma on CoachBranding but never migrated, so any INSERT/UPDATE
-- mentioning them failed with 42703 (see TECHNICAL.md §20.7).
ALTER TABLE "CoachBranding" ADD COLUMN IF NOT EXISTS "whatsappUrl" TEXT;
ALTER TABLE "CoachBranding" ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT;
ALTER TABLE "CoachBranding" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
