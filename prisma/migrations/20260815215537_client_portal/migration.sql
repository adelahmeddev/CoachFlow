/*
  Warnings:

  - You are about to drop the column `rpe` on the `ExerciseLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "email" TEXT,
ADD COLUMN     "passwordHash" TEXT;

-- AlterTable
ALTER TABLE "ExerciseLog" DROP COLUMN "rpe",
ADD COLUMN     "rve" INTEGER;

-- CreateTable
CREATE TABLE "DailyLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "sleepHours" DOUBLE PRECISION,
    "waterLiters" DOUBLE PRECISION,
    "energyLevel" INTEGER,
    "moodLevel" INTEGER,
    "nutritionCompliant" BOOLEAN,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyLog_clientId_idx" ON "DailyLog"("clientId");

-- CreateIndex
CREATE INDEX "DailyLog_date_idx" ON "DailyLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_clientId_date_key" ON "DailyLog"("clientId", "date");

-- AddForeignKey
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
