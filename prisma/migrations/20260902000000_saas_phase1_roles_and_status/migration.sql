-- CreateEnum
CREATE TYPE "TrainerAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterEnum: Rename ADMIN -> SUPER_ADMIN in Role enum
ALTER TYPE "Role" RENAME VALUE 'ADMIN' TO 'SUPER_ADMIN';

-- AlterEnum: Rename TRAINER -> COACH in Role enum
ALTER TYPE "Role" RENAME VALUE 'TRAINER' TO 'COACH';

-- AlterTable: Add accountStatus to TrainerProfile
ALTER TABLE "TrainerProfile" ADD COLUMN "accountStatus" "TrainerAccountStatus" NOT NULL DEFAULT 'ACTIVE';
