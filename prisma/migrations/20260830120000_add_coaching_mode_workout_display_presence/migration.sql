-- CreateEnum
CREATE TYPE "CoachingMode" AS ENUM ('ONLINE', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "WorkoutDisplayMode" AS ENUM ('FULL', 'DAY_NAME_ONLY');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN "coachingMode" "CoachingMode" NOT NULL DEFAULT 'ONLINE';

-- AlterTable
ALTER TABLE "Client" ADD COLUMN "workoutDisplayMode" "WorkoutDisplayMode" NOT NULL DEFAULT 'FULL';

-- AlterTable
ALTER TABLE "TrainingSplitTemplate" ADD COLUMN "isMultiSplit" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TrainingSplitTemplate" ADD COLUMN "splitGroup" INTEGER;

-- CreateTable
CREATE TABLE "PresenceSession" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "trainerId" TEXT,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresenceSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PresenceSession_clientId_idx" ON "PresenceSession"("clientId");

-- CreateIndex
CREATE INDEX "PresenceSession_trainerId_idx" ON "PresenceSession"("trainerId");

-- CreateIndex
CREATE INDEX "PresenceSession_expiresAt_idx" ON "PresenceSession"("expiresAt");
