-- AlterTable
ALTER TABLE "Koopovereenkomst" ADD COLUMN     "jsonData" JSONB DEFAULT '{}',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';
