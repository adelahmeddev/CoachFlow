-- AlterTable: Drop decommissioned groupNumber column from MealItem
ALTER TABLE "MealItem" DROP COLUMN IF EXISTS "groupNumber";
