-- CreateTable MealNote
CREATE TABLE IF NOT EXISTS "MealNote" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealNote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MealNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealNote_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MealNote_clientId_mealId_date_key" ON "MealNote"("clientId", "mealId", "date");
CREATE INDEX IF NOT EXISTS "MealNote_clientId_date_idx" ON "MealNote"("clientId", "date");
CREATE INDEX IF NOT EXISTS "MealNote_mealId_idx" ON "MealNote"("mealId");
