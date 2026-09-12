-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('TRANSFORMATION', 'TRAINING', 'NUTRITION', 'TIPS', 'EDUCATION', 'GENERAL');

-- CreateTable
CREATE TABLE "CoachPost" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "category" "PostCategory" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "beforeImageUrl" TEXT,
    "afterImageUrl" TEXT,
    "clientDisplayName" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostImageFile" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'image/webp',
    "byteSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostImageFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachPost_coachId_published_idx" ON "CoachPost"("coachId", "published");

-- CreateIndex
CREATE INDEX "CoachPost_coachId_createdAt_idx" ON "CoachPost"("coachId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PostImageFile_coachId_idx" ON "PostImageFile"("coachId");

-- AddForeignKey
ALTER TABLE "CoachPost" ADD CONSTRAINT "CoachPost_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostImageFile" ADD CONSTRAINT "PostImageFile_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
