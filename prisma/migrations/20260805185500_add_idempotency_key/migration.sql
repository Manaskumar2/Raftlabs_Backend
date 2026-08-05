-- AlterTable
ALTER TABLE "orders" ADD COLUMN "idempotency_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");

-- CreateIndex
CREATE INDEX "orders_phone_number_idx" ON "orders"("phone_number");
