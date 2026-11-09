-- Add externalId to Sale for offline synchronization.
ALTER TABLE "Sale"
ADD COLUMN "externalId" UUID;

-- Ensure each externalId is unique.
CREATE UNIQUE INDEX "Sale_externalId_key"
ON "Sale"("externalId");
