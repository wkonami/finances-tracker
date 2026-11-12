/*
  Warnings:

  - You are about to drop the column `userId` on the `Supplier` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_userId_fkey";

-- DropIndex
DROP INDEX "Supplier_userId_deletedAt_idx";

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "userId";

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- CreateIndex
CREATE INDEX "Supplier_deletedAt_idx" ON "Supplier"("deletedAt");
