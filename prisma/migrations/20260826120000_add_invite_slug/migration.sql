-- AlterTable
ALTER TABLE "TrainerProfile" ADD COLUMN     "inviteSlug" TEXT,
ADD COLUMN     "inviteSlugCreatedAt" TIMESTAMP(3),
ADD COLUMN     "previousInviteSlug" TEXT,
ADD COLUMN     "previousInviteSlugExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "TrainerProfile_inviteSlug_key" ON "TrainerProfile"("inviteSlug");
CREATE UNIQUE INDEX "TrainerProfile_previousInviteSlug_key" ON "TrainerProfile"("previousInviteSlug");
