/*
  Warnings:

  - You are about to drop the table `ProgramInfo`, which was not empty (8 rows).

*/
-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('SESSIONS', 'PERIOD');

-- DropTable
DROP TABLE "ProgramInfo";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "planType" "PlanType" NOT NULL DEFAULT 'PERIOD',
ADD COLUMN     "durationDays" INTEGER;
