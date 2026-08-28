-- CreateEnum
CREATE TYPE "BodyCompositionSource" AS ENUM ('COACH', 'CLIENT');

-- CreateEnum
CREATE TYPE "SubstituteCategory" AS ENUM ('CARB', 'PROTEIN', 'FAT', 'FRUIT');

-- AlterTable
ALTER TABLE "ClientNutritionPlan" ADD COLUMN     "avoidFoods" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "coachMessage" TEXT,
ADD COLUMN     "guidelines" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "recommendedFoods" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "NutritionTemplate" ADD COLUMN     "avoidFoods" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "coachMessage" TEXT,
ADD COLUMN     "guidelines" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "recommendedFoods" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "TemplateMeal" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,

    CONSTRAINT "TemplateMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateMealItem" (
    "id" TEXT NOT NULL,
    "templateMealId" TEXT NOT NULL,
    "groupNumber" INTEGER NOT NULL DEFAULT 1,
    "foodName" TEXT NOT NULL,
    "amount" TEXT,
    "calories" INTEGER,
    "order" INTEGER NOT NULL,

    CONSTRAINT "TemplateMealItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateSupplement" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "supplementId" TEXT,
    "name" TEXT NOT NULL,
    "dose" TEXT,
    "timing" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "TemplateSupplement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealItem" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "groupNumber" INTEGER NOT NULL DEFAULT 1,
    "foodName" TEXT NOT NULL,
    "amount" TEXT,
    "calories" INTEGER,
    "order" INTEGER NOT NULL,

    CONSTRAINT "MealItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanSupplement" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "supplementId" TEXT,
    "name" TEXT NOT NULL,
    "dose" TEXT,
    "timing" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "PlanSupplement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyComposition" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "source" "BodyCompositionSource" NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "muscleMassKg" DOUBLE PRECISION,
    "bodyFatKg" DOUBLE PRECISION,
    "bodyWaterPct" DOUBLE PRECISION,
    "fatControlKg" DOUBLE PRECISION,
    "bmrKcal" DOUBLE PRECISION,
    "fitnessScore" INTEGER,
    "waistHipRatio" DOUBLE PRECISION,
    "visceralFatLevel" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyComposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodSubstitute" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT,
    "category" "SubstituteCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "amount" TEXT,
    "calories" INTEGER,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FoodSubstitute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalSupplement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "definition" TEXT,
    "definitionAr" TEXT,
    "benefits" TEXT,
    "benefitsAr" TEXT,

    CONSTRAINT "GlobalSupplement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealChoice" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "mealItemId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyCheckIn" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemplateMeal_templateId_idx" ON "TemplateMeal"("templateId");

-- CreateIndex
CREATE INDEX "TemplateMealItem_templateMealId_idx" ON "TemplateMealItem"("templateMealId");

-- CreateIndex
CREATE INDEX "TemplateSupplement_templateId_idx" ON "TemplateSupplement"("templateId");

-- CreateIndex
CREATE INDEX "Meal_planId_idx" ON "Meal"("planId");

-- CreateIndex
CREATE INDEX "MealItem_mealId_idx" ON "MealItem"("mealId");

-- CreateIndex
CREATE INDEX "PlanSupplement_planId_idx" ON "PlanSupplement"("planId");

-- CreateIndex
CREATE INDEX "BodyComposition_clientId_idx" ON "BodyComposition"("clientId");

-- CreateIndex
CREATE INDEX "BodyComposition_date_idx" ON "BodyComposition"("date");

-- CreateIndex
CREATE INDEX "FoodSubstitute_category_idx" ON "FoodSubstitute"("category");

-- CreateIndex
CREATE INDEX "FoodSubstitute_trainerId_idx" ON "FoodSubstitute"("trainerId");

-- CreateIndex
CREATE INDEX "MealChoice_clientId_date_idx" ON "MealChoice"("clientId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MealChoice_clientId_mealItemId_date_key" ON "MealChoice"("clientId", "mealItemId", "date");

-- CreateIndex
CREATE INDEX "WeeklyCheckIn_clientId_idx" ON "WeeklyCheckIn"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyCheckIn_clientId_date_key" ON "WeeklyCheckIn"("clientId", "date");

-- AddForeignKey
ALTER TABLE "TemplateMeal" ADD CONSTRAINT "TemplateMeal_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NutritionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateMealItem" ADD CONSTRAINT "TemplateMealItem_templateMealId_fkey" FOREIGN KEY ("templateMealId") REFERENCES "TemplateMeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateSupplement" ADD CONSTRAINT "TemplateSupplement_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NutritionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateSupplement" ADD CONSTRAINT "TemplateSupplement_supplementId_fkey" FOREIGN KEY ("supplementId") REFERENCES "GlobalSupplement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ClientNutritionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealItem" ADD CONSTRAINT "MealItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSupplement" ADD CONSTRAINT "PlanSupplement_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ClientNutritionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSupplement" ADD CONSTRAINT "PlanSupplement_supplementId_fkey" FOREIGN KEY ("supplementId") REFERENCES "GlobalSupplement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyComposition" ADD CONSTRAINT "BodyComposition_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodSubstitute" ADD CONSTRAINT "FoodSubstitute_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealChoice" ADD CONSTRAINT "MealChoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealChoice" ADD CONSTRAINT "MealChoice_mealItemId_fkey" FOREIGN KEY ("mealItemId") REFERENCES "MealItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyCheckIn" ADD CONSTRAINT "WeeklyCheckIn_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
