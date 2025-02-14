/*
  Warnings:

  - The values [CREDIT,OTHER] on the enum `PaymentFor` will be removed. If these variants are still used in the database, this will fail.
  - The `plan` column on the `credit_offers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `gstNumber` on the `users` table. All the data in the column will be lost.
  - Made the column `createdTime` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentFor_new" AS ENUM ('SUBSCRIPTION', 'CONTRACT');
ALTER TABLE "payments" ALTER COLUMN "paymentFor" TYPE "PaymentFor_new" USING ("paymentFor"::text::"PaymentFor_new");
ALTER TYPE "PaymentFor" RENAME TO "PaymentFor_old";
ALTER TYPE "PaymentFor_new" RENAME TO "PaymentFor";
DROP TYPE "PaymentFor_old";
COMMIT;

-- DropIndex
DROP INDEX "users_gstNumber_key";

-- AlterTable
ALTER TABLE "credit_offers" DROP COLUMN "plan",
ADD COLUMN     "plan" TEXT DEFAULT 'BASIC';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "createdTime" SET NOT NULL,
ALTER COLUMN "paymentFor" SET DEFAULT 'CONTRACT',
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "gstNumber";

-- DropEnum
DROP TYPE "CreditOfferPlan";

-- CreateIndex
CREATE INDEX "payments_uid_idx" ON "payments"("uid");
