-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('UNKNOWN', 'CASH', 'PIX', 'CARD');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'UNKNOWN';
