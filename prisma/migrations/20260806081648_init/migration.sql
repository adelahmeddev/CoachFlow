-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TRAINER', 'CLIENT');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('INVITED', 'PENDING_ASSESSMENT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Goal" AS ENUM ('WEIGHT_LOSS', 'MUSCLE_BUILDING', 'STRENGTH', 'GENERAL_FITNESS', 'WEIGHT_GAIN', 'REHAB');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('BASELINE', 'PROGRESS', 'REASSESSMENT');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SplitType" AS ENUM ('FULL_BODY', 'UPPER_LOWER', 'PUSH_PULL_LEGS', 'BRO_SPLIT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TrainingDayFocus" AS ENUM ('REST', 'UPPER', 'LOWER', 'FULL_BODY', 'PUSH', 'PULL', 'LEGS', 'SHOULDERS_ARMS', 'CARDIO', 'MOBILITY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'ACTIVE', 'EXPIRED', 'PAUSED', 'TRIAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PENDING', 'FAILED', 'NOT_REQUIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TRAINER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT,
    "goal" "Goal",
    "status" "ClientStatus" NOT NULL DEFAULT 'INVITED',
    "inviteToken" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "basicInfoCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL DEFAULT 'BASELINE',
    "completedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "bmrKcal" DOUBLE PRECISION,
    "tdeeKcal" DOUBLE PRECISION,
    "shoulderCm" DOUBLE PRECISION,
    "chestCm" DOUBLE PRECISION,
    "waistCm" DOUBLE PRECISION,
    "hipsCm" DOUBLE PRECISION,
    "rightArmCm" DOUBLE PRECISION,
    "leftArmCm" DOUBLE PRECISION,
    "rightThighCm" DOUBLE PRECISION,
    "leftThighCm" DOUBLE PRECISION,
    "sleepHours" DOUBLE PRECISION,
    "activityLevel" "ActivityLevel",
    "mainGoal" "Goal",
    "targetWeightKg" DOUBLE PRECISION,
    "targetDate" TIMESTAMP(3),
    "neckPain" BOOLEAN NOT NULL DEFAULT false,
    "shoulderPain" BOOLEAN NOT NULL DEFAULT false,
    "backPain" BOOLEAN NOT NULL DEFAULT false,
    "kneePain" BOOLEAN NOT NULL DEFAULT false,
    "otherPain" TEXT,
    "mobilityNotes" TEXT,
    "bodyweightSquatsReps" INTEGER,
    "pushUpsReps" INTEGER,
    "plankSeconds" INTEGER,
    "latPulldownKg" DOUBLE PRECISION,
    "latPulldownReps" INTEGER,
    "walkTestDistanceMeters" INTEGER,
    "walkTestPerformanceLevel" TEXT,
    "trainerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionTemplate" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT,
    "name" TEXT NOT NULL,
    "calories" INTEGER,
    "proteinGrams" DOUBLE PRECISION,
    "carbsGrams" DOUBLE PRECISION,
    "fatsGrams" DOUBLE PRECISION,
    "waterLiters" DOUBLE PRECISION,
    "notes" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientNutritionPlan" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "templateId" TEXT,
    "calories" INTEGER,
    "proteinGrams" DOUBLE PRECISION,
    "carbsGrams" DOUBLE PRECISION,
    "fatsGrams" DOUBLE PRECISION,
    "waterLiters" DOUBLE PRECISION,
    "notes" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientNutritionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramInfo" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" "Goal",
    "level" TEXT,
    "focus" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSplit" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "splitType" "SplitType" NOT NULL,
    "daysPerWeek" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSplitDay" (
    "id" TEXT NOT NULL,
    "splitId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "focus" "TrainingDayFocus" NOT NULL,
    "customFocus" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSplitDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "sessionsCount" INTEGER,
    "remainingSessions" INTEGER,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressReview" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainerNotes" TEXT,
    "adherencePct" DOUBLE PRECISION,
    "energyLevel" INTEGER,
    "nextAssessmentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exerciseName" TEXT NOT NULL,
    "sets" INTEGER,
    "reps" INTEGER,
    "weightKg" DOUBLE PRECISION,
    "rpe" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerProfile_userId_key" ON "TrainerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_userId_key" ON "Client"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_inviteToken_key" ON "Client"("inviteToken");

-- CreateIndex
CREATE INDEX "Client_trainerId_idx" ON "Client"("trainerId");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "Client_goal_idx" ON "Client"("goal");

-- CreateIndex
CREATE INDEX "Assessment_clientId_idx" ON "Assessment"("clientId");

-- CreateIndex
CREATE INDEX "Assessment_type_idx" ON "Assessment"("type");

-- CreateIndex
CREATE INDEX "Assessment_completedDate_idx" ON "Assessment"("completedDate");

-- CreateIndex
CREATE INDEX "NutritionTemplate_trainerId_idx" ON "NutritionTemplate"("trainerId");

-- CreateIndex
CREATE INDEX "ClientNutritionPlan_clientId_idx" ON "ClientNutritionPlan"("clientId");

-- CreateIndex
CREATE INDEX "ClientNutritionPlan_status_idx" ON "ClientNutritionPlan"("status");

-- CreateIndex
CREATE INDEX "ProgramInfo_clientId_idx" ON "ProgramInfo"("clientId");

-- CreateIndex
CREATE INDEX "ProgramInfo_status_idx" ON "ProgramInfo"("status");

-- CreateIndex
CREATE INDEX "TrainingSplit_clientId_idx" ON "TrainingSplit"("clientId");

-- CreateIndex
CREATE INDEX "TrainingSplit_status_idx" ON "TrainingSplit"("status");

-- CreateIndex
CREATE INDEX "TrainingSplitDay_splitId_idx" ON "TrainingSplitDay"("splitId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingSplitDay_splitId_dayNumber_key" ON "TrainingSplitDay"("splitId", "dayNumber");

-- CreateIndex
CREATE INDEX "Subscription_clientId_idx" ON "Subscription"("clientId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "ProgressReview_clientId_idx" ON "ProgressReview"("clientId");

-- CreateIndex
CREATE INDEX "WorkoutLog_clientId_idx" ON "WorkoutLog"("clientId");

-- CreateIndex
CREATE INDEX "WorkoutLog_date_idx" ON "WorkoutLog"("date");

-- AddForeignKey
ALTER TABLE "TrainerProfile" ADD CONSTRAINT "TrainerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionTemplate" ADD CONSTRAINT "NutritionTemplate_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNutritionPlan" ADD CONSTRAINT "ClientNutritionPlan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNutritionPlan" ADD CONSTRAINT "ClientNutritionPlan_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NutritionTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramInfo" ADD CONSTRAINT "ProgramInfo_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSplit" ADD CONSTRAINT "TrainingSplit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSplitDay" ADD CONSTRAINT "TrainingSplitDay_splitId_fkey" FOREIGN KEY ("splitId") REFERENCES "TrainingSplit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReview" ADD CONSTRAINT "ProgressReview_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
