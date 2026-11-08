
-- Remove as chaves estrangeiras antigas.
ALTER TABLE "Debt"
DROP CONSTRAINT "Debt_userId_fkey";

ALTER TABLE "Payment"
DROP CONSTRAINT "Payment_debtId_fkey";

-- Renomeia a tabela preservando os registros.
ALTER TABLE "Debt"
RENAME TO "Sale";

-- Renomeia a coluna preservando os pagamentos.
ALTER TABLE "Payment"
RENAME COLUMN "debtId" TO "saleId";

-- Renomeia o índice existente.
ALTER INDEX "Payment_debtId_paymentDate_idx"
RENAME TO "Payment_saleId_paymentDate_idx";

-- Renomeia a chave primária.
ALTER TABLE "Sale"
RENAME CONSTRAINT "Debt_pkey" TO "Sale_pkey";

-- Recria as chaves estrangeiras.
ALTER TABLE "Sale"
ADD CONSTRAINT "Sale_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_saleId_fkey"
FOREIGN KEY ("saleId")
REFERENCES "Sale"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
