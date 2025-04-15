-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pendingOrganizationId" TEXT,
ADD COLUMN     "registrationStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_pendingOrganizationId_fkey" FOREIGN KEY ("pendingOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
