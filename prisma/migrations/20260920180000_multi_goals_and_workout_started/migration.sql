-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'WORKOUT_STARTED';

-- AlterTable
ALTER TABLE "Client" ADD COLUMN "goals" "Goal"[] NOT NULL DEFAULT ARRAY[]::"Goal"[];

-- Backfill
UPDATE "Client" SET "goals" = ARRAY["goal"] WHERE "goal" IS NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "Client_goal_idx";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN IF EXISTS "goal";
