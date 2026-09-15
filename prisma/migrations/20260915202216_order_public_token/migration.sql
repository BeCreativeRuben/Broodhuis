/*
  Warnings:

  - Added the required column `publicToken` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fulfillmentType" TEXT NOT NULL,
    "slotDate" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "slotLabel" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "street" TEXT,
    "houseNumber" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "deliveryNote" TEXT,
    "note" TEXT,
    "subtotalCents" INTEGER NOT NULL,
    "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "paymentProvider" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'open',
    "paymentMethod" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Order" ("city", "createdAt", "customerEmail", "customerName", "customerPhone", "deliveryFeeCents", "deliveryNote", "fulfillmentType", "houseNumber", "id", "note", "orderNumber", "paidAt", "paymentMethod", "paymentProvider", "paymentStatus", "postalCode", "slotDate", "slotId", "slotLabel", "status", "street", "subtotalCents", "totalCents", "updatedAt") SELECT "city", "createdAt", "customerEmail", "customerName", "customerPhone", "deliveryFeeCents", "deliveryNote", "fulfillmentType", "houseNumber", "id", "note", "orderNumber", "paidAt", "paymentMethod", "paymentProvider", "paymentStatus", "postalCode", "slotDate", "slotId", "slotLabel", "status", "street", "subtotalCents", "totalCents", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_publicToken_key" ON "Order"("publicToken");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_slotDate_idx" ON "Order"("slotDate");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
