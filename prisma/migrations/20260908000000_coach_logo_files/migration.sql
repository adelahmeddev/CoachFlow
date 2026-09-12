-- Coach logo files: processed WebP bytes live here (one row per coach,
-- overwritten on re-upload so no orphans). CoachBranding.logoUrl holds only
-- the short public URL (/api/coach-logo/<coachId>?v=<ts>). Legacy data-URL
-- logoUrl values keep rendering and need no migration.
CREATE TABLE "CoachLogoFile" (
    "coachId" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'image/webp',
    "byteSize" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachLogoFile_pkey" PRIMARY KEY ("coachId"),
    CONSTRAINT "CoachLogoFile_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
