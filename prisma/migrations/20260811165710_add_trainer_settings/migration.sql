-- CreateEnum
CREATE TYPE "Units" AS ENUM ('METRIC', 'IMPERIAL');

-- CreateEnum
CREATE TYPE "WeekStartDay" AS ENUM ('SAT', 'SUN', 'MON');

-- AlterTable
ALTER TABLE "TrainerProfile" ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "notifyInactivity" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyReassessment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifySubscription" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "units" "Units" NOT NULL DEFAULT 'METRIC',
ADD COLUMN     "weekStartDay" "WeekStartDay" NOT NULL DEFAULT 'SAT',
ADD COLUMN     "weeklySummary" BOOLEAN NOT NULL DEFAULT false;
