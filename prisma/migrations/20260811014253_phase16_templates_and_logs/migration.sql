-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "muscleGroup" TEXT NOT NULL,
    "equipment" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultSets" INTEGER,
    "defaultReps" INTEGER,
    "defaultRestSeconds" INTEGER,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSplitTemplate" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT,
    "name" TEXT NOT NULL,
    "goal" "Goal",
    "level" TEXT,
    "splitType" "SplitType" NOT NULL,
    "daysPerWeek" INTEGER NOT NULL,
    "description" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSplitTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSplitTemplateDay" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "focus" "TrainingDayFocus" NOT NULL,
    "customFocus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSplitTemplateDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateDayExercise" (
    "id" TEXT NOT NULL,
    "templateDayId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "exerciseId" TEXT,
    "exerciseName" TEXT NOT NULL,
    "targetSets" INTEGER,
    "targetReps" INTEGER,
    "targetWeightKg" DOUBLE PRECISION,
    "restSeconds" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateDayExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitDayExercise" (
    "id" TEXT NOT NULL,
    "splitDayId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "exerciseId" TEXT,
    "exerciseName" TEXT NOT NULL,
    "targetSets" INTEGER,
    "targetReps" INTEGER,
    "targetWeightKg" DOUBLE PRECISION,
    "restSeconds" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitDayExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseLog" (
    "id" TEXT NOT NULL,
    "splitDayExerciseId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualSets" INTEGER,
    "actualReps" INTEGER,
    "actualWeightKg" DOUBLE PRECISION,
    "rpe" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");

-- CreateIndex
CREATE INDEX "Exercise_muscleGroup_idx" ON "Exercise"("muscleGroup");

-- CreateIndex
CREATE INDEX "TrainingSplitTemplate_trainerId_idx" ON "TrainingSplitTemplate"("trainerId");

-- CreateIndex
CREATE INDEX "TrainingSplitTemplate_isGlobal_idx" ON "TrainingSplitTemplate"("isGlobal");

-- CreateIndex
CREATE INDEX "TrainingSplitTemplateDay_templateId_idx" ON "TrainingSplitTemplateDay"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingSplitTemplateDay_templateId_dayNumber_key" ON "TrainingSplitTemplateDay"("templateId", "dayNumber");

-- CreateIndex
CREATE INDEX "TemplateDayExercise_templateDayId_idx" ON "TemplateDayExercise"("templateDayId");

-- CreateIndex
CREATE INDEX "SplitDayExercise_splitDayId_idx" ON "SplitDayExercise"("splitDayId");

-- CreateIndex
CREATE INDEX "ExerciseLog_clientId_idx" ON "ExerciseLog"("clientId");

-- CreateIndex
CREATE INDEX "ExerciseLog_date_idx" ON "ExerciseLog"("date");

-- AddForeignKey
ALTER TABLE "TrainingSplitTemplate" ADD CONSTRAINT "TrainingSplitTemplate_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSplitTemplateDay" ADD CONSTRAINT "TrainingSplitTemplateDay_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TrainingSplitTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateDayExercise" ADD CONSTRAINT "TemplateDayExercise_templateDayId_fkey" FOREIGN KEY ("templateDayId") REFERENCES "TrainingSplitTemplateDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateDayExercise" ADD CONSTRAINT "TemplateDayExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitDayExercise" ADD CONSTRAINT "SplitDayExercise_splitDayId_fkey" FOREIGN KEY ("splitDayId") REFERENCES "TrainingSplitDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitDayExercise" ADD CONSTRAINT "SplitDayExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseLog" ADD CONSTRAINT "ExerciseLog_splitDayExerciseId_fkey" FOREIGN KEY ("splitDayExerciseId") REFERENCES "SplitDayExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseLog" ADD CONSTRAINT "ExerciseLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
