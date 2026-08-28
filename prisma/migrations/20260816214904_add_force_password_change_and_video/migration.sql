-- AlterTable
ALTER TABLE "SplitDayExercise" ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "TemplateDayExercise" ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
