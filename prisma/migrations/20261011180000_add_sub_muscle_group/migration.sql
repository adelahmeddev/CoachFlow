-- AlterTable Exercise
ALTER TABLE "Exercise" ADD COLUMN IF NOT EXISTS "subMuscleGroup" TEXT;

-- AlterTable ExerciseOverride
ALTER TABLE "ExerciseOverride" ADD COLUMN IF NOT EXISTS "subMuscleGroup" TEXT;
