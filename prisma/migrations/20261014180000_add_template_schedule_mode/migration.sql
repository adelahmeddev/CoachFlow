-- AlterTable
ALTER TABLE "TrainingSplitTemplate" ADD COLUMN IF NOT EXISTS "scheduleMode" "ScheduleMode" NOT NULL DEFAULT 'FIXED_WEEKDAYS';

-- AlterTable
ALTER TABLE "TrainingSplitTemplateDay" ADD COLUMN IF NOT EXISTS "weekday" "Weekday";
