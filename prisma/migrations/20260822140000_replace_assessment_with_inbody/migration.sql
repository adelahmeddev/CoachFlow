-- AlterTable Client: add pain flags
ALTER TABLE "Client" ADD COLUMN     "neckPain" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Client" ADD COLUMN     "shoulderPain" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Client" ADD COLUMN     "backPain" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Client" ADD COLUMN     "kneePain" BOOLEAN NOT NULL DEFAULT false;

-- DropTable Assessment
DROP TABLE "Assessment";

-- DropEnum
DROP TYPE "Sex";
DROP TYPE "AssessmentType";
DROP TYPE "ActivityLevel";
DROP TYPE "SleepHoursCategory";
DROP TYPE "MobilityResult";
DROP TYPE "HamstringResult";
DROP TYPE "WalkTestPerformance";