-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingCountry" TEXT,
ADD COLUMN     "billingEmail" TEXT,
ADD COLUMN     "billingName" TEXT,
ADD COLUMN     "billingPostalCode" TEXT,
ADD COLUMN     "billingVATNumber" TEXT,
ADD COLUMN     "hasKoopovereenkomstenAccess" BOOLEAN NOT NULL DEFAULT false;
