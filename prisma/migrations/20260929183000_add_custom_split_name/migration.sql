-- AlterTable
ALTER TABLE "TrainingSplitTemplate" ADD COLUMN IF NOT EXISTS "customSplitName" TEXT;

-- AlterTable
ALTER TABLE "TrainingSplit" ADD COLUMN IF NOT EXISTS "customSplitName" TEXT;
