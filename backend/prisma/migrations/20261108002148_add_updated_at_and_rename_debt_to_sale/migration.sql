/*
  Warnings:

  - Added the required column `updatedAt` to the `Debt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Purchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Debt" ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "Debt"
SET "updatedAt" = CURRENT_TIMESTAMP
WHERE "updatedAt" IS NULL;

ALTER TABLE "Debt"
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "User"
SET "updatedAt" = CURRENT_TIMESTAMP
WHERE "updatedAt" IS NULL;

ALTER TABLE "User"
ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Payment_debtId_paymentDate_idx" ON "Payment"("debtId", "paymentDate");

-- CreateIndex
CREATE INDEX "PurchasePayment_purchaseId_paymentDate_idx" ON "PurchasePayment"("purchaseId", "paymentDate");
