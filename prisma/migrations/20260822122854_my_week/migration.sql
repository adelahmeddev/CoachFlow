-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI');

-- CreateEnum
CREATE TYPE "ScheduleMode" AS ENUM ('FIXED_WEEKDAYS', 'SEQUENTIAL');

-- AlterTable
ALTER TABLE "TrainingSplit" ADD COLUMN     "scheduleMode" "ScheduleMode" NOT NULL DEFAULT 'FIXED_WEEKDAYS';

-- AlterTable
ALTER TABLE "TrainingSplitDay" ADD COLUMN     "weekday" "Weekday";
