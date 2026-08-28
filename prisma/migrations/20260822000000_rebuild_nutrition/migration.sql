-- CreateEnum
CREATE TYPE "QuantityUnit" AS ENUM ('G', 'ML', 'PCS');

-- CreateEnum
CREATE TYPE "MealKind" AS ENUM ('MEAL', 'SNACK');

-- DropForeignKey
ALTER TABLE "FoodSubstitute" DROP CONSTRAINT "FoodSubstitute_trainerId_fkey";

-- DropForeignKey
ALTER TABLE "PlanSupplement" DROP CONSTRAINT "PlanSupplement_planId_fkey";

-- DropForeignKey
ALTER TABLE "PlanSupplement" DROP CONSTRAINT "PlanSupplement_supplementId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateMeal" DROP CONSTRAINT "TemplateMeal_templateId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateMealItem" DROP CONSTRAINT "TemplateMealItem_templateMealId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateSupplement" DROP CONSTRAINT "TemplateSupplement_supplementId_fkey";

-- DropForeignKey
ALTER TABLE "TemplateSupplement" DROP CONSTRAINT "TemplateSupplement_templateId_fkey";

-- AlterTable
ALTER TABLE "ClientNutritionPlan" DROP COLUMN "notes";

-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "kind" "MealKind" NOT NULL DEFAULT 'MEAL',
ADD COLUMN     "templateId" TEXT,
ALTER COLUMN "planId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MealItem" ADD COLUMN     "foodNameAr" TEXT,
ADD COLUMN     "unit" "QuantityUnit" NOT NULL DEFAULT 'G',
DROP COLUMN "amount",
ADD COLUMN     "amount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "NutritionTemplate" DROP COLUMN "notes";

-- DropTable
DROP TABLE "FoodSubstitute";

-- DropTable
DROP TABLE "GlobalSupplement";

-- DropTable
DROP TABLE "PlanSupplement";

-- DropTable
DROP TABLE "TemplateMeal";

-- DropTable
DROP TABLE "TemplateMealItem";

-- DropTable
DROP TABLE "TemplateSupplement";

-- CreateTable
CREATE TABLE "SupplementDef" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "planId" TEXT,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "definition" TEXT,
    "definitionAr" TEXT,
    "importance" TEXT,
    "importanceAr" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "SupplementDef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstituteGroup" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "planId" TEXT,
    "category" "SubstituteCategory" NOT NULL,
    "caloriesLabel" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "SubstituteGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstituteItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "amount" DOUBLE PRECISION,
    "unit" "QuantityUnit" NOT NULL DEFAULT 'G',
    "order" INTEGER NOT NULL,

    CONSTRAINT "SubstituteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplementDef_templateId_idx" ON "SupplementDef"("templateId");

-- CreateIndex
CREATE INDEX "SupplementDef_planId_idx" ON "SupplementDef"("planId");

-- CreateIndex
CREATE INDEX "SubstituteGroup_templateId_idx" ON "SubstituteGroup"("templateId");

-- CreateIndex
CREATE INDEX "SubstituteGroup_planId_idx" ON "SubstituteGroup"("planId");

-- CreateIndex
CREATE INDEX "SubstituteItem_groupId_idx" ON "SubstituteItem"("groupId");

-- CreateIndex
CREATE INDEX "Meal_templateId_idx" ON "Meal"("templateId");

-- AddForeignKey
ALTER TABLE "SupplementDef" ADD CONSTRAINT "SupplementDef_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NutritionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplementDef" ADD CONSTRAINT "SupplementDef_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ClientNutritionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituteGroup" ADD CONSTRAINT "SubstituteGroup_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NutritionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituteGroup" ADD CONSTRAINT "SubstituteGroup_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ClientNutritionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituteItem" ADD CONSTRAINT "SubstituteItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SubstituteGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NutritionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
