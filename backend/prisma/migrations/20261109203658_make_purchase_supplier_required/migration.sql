/*
  Warnings:

  - Made the column `supplierId` on table `Purchase` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
-- Cria um fornecedor "Outros" somente para usuários
-- que possuem compras sem fornecedor.
INSERT INTO "Supplier" (
    "name",
    "userId",
    "createdAt",
    "updatedAt"
)
SELECT
    'Outros',
    p."userId",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Purchase" p
WHERE p."supplierId" IS NULL
GROUP BY p."userId";

-- Associa cada compra sem fornecedor ao fornecedor "Outros"
-- pertencente ao mesmo usuário.
UPDATE "Purchase" p
SET "supplierId" = s."id"
FROM "Supplier" s
WHERE p."supplierId" IS NULL
  AND s."userId" = p."userId"
  AND s."name" = 'Outros'
  AND s."deletedAt" IS NULL;

-- Torna o fornecedor obrigatório.
ALTER TABLE "Purchase"
ALTER COLUMN "supplierId" SET NOT NULL;