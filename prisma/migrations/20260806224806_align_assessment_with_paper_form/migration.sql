/*
  Warnings:

  - You are about to drop the column `sleepHours` on the `Assessment` table. All the data in the column will be lost.
  - The `walkTestPerformanceLevel` column on the `Assessment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SleepHoursCategory" AS ENUM ('LESS_THAN_5', 'HOURS_5_6', 'HOURS_6_8', 'HOURS_8_PLUS');

-- CreateEnum
CREATE TYPE "MobilityResult" AS ENUM ('GOOD', 'LIMITED', 'PAIN');

-- CreateEnum
CREATE TYPE "HamstringResult" AS ENUM ('GOOD', 'LIMITED', 'TIGHT');

-- CreateEnum
CREATE TYPE "WalkTestPerformance" AS ENUM ('POOR', 'AVERAGE', 'GOOD');

-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "sleepHours",
ADD COLUMN     "hamstringFlexibility" "HamstringResult",
ADD COLUMN     "job" TEXT,
ADD COLUMN     "nextReassessmentDate" TIMESTAMP(3),
ADD COLUMN     "shoulderOverheadRaise" "MobilityResult",
ADD COLUMN     "sleepCategory" "SleepHoursCategory",
ADD COLUMN     "squatMobility" "MobilityResult",
ADD COLUMN     "trainerSignature" TEXT,
ADD COLUMN     "trainingDaysAvailable" TEXT,
ADD COLUMN     "walkTestIncline" DOUBLE PRECISION,
ADD COLUMN     "walkTestMinutes" INTEGER DEFAULT 4,
ADD COLUMN     "walkTestSpeedKmh" DOUBLE PRECISION,
DROP COLUMN "walkTestPerformanceLevel",
ADD COLUMN     "walkTestPerformanceLevel" "WalkTestPerformance";
