-- Dedicated coach personal photo, distinct from the brand logo.
-- TrainerProfile.avatarUrl holds a versioned /api/coach-avatar/<coachId>?v=
-- URL; CoachAvatarFile stores the cropped WebP bytes (mirrors CoachLogoFile).
ALTER TABLE "TrainerProfile" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

CREATE TABLE IF NOT EXISTS "CoachAvatarFile" (
  "coachId" TEXT NOT NULL,
  "bytes" BYTEA NOT NULL,
  "contentType" TEXT NOT NULL DEFAULT 'image/webp',
  "byteSize" INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CoachAvatarFile_pkey" PRIMARY KEY ("coachId")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CoachAvatarFile_coachId_fkey'
  ) THEN
    ALTER TABLE "CoachAvatarFile" ADD CONSTRAINT "CoachAvatarFile_coachId_fkey"
      FOREIGN KEY ("coachId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
