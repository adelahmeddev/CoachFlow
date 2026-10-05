-- AlterTable Exercise
ALTER TABLE "Exercise" DROP COLUMN IF EXISTS "isGlobal";
ALTER TABLE "Exercise" ADD COLUMN IF NOT EXISTS "trainerId" TEXT;

-- DropIndex
DROP INDEX IF EXISTS "Exercise_name_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Exercise_trainerId_name_key" ON "Exercise"("trainerId", "name");
CREATE INDEX IF NOT EXISTS "Exercise_trainerId_idx" ON "Exercise"("trainerId");

-- AddForeignKey
ALTER TABLE "Exercise" DROP CONSTRAINT IF EXISTS "Exercise_trainerId_fkey";
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable ExerciseOverride
CREATE TABLE IF NOT EXISTS "ExerciseOverride" (
    "trainerId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "name" TEXT,
    "nameAr" TEXT,
    "youtubeUrl" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseOverride_pkey" PRIMARY KEY ("trainerId","exerciseId")
);

-- AddForeignKey ExerciseOverride
ALTER TABLE "ExerciseOverride" DROP CONSTRAINT IF EXISTS "ExerciseOverride_trainerId_fkey";
ALTER TABLE "ExerciseOverride" ADD CONSTRAINT "ExerciseOverride_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExerciseOverride" DROP CONSTRAINT IF EXISTS "ExerciseOverride_exerciseId_fkey";
ALTER TABLE "ExerciseOverride" ADD CONSTRAINT "ExerciseOverride_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
