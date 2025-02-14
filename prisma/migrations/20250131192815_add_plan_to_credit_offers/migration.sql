/*
  Warnings:

  - The values [CONTRACT] on the enum `PaymentFor` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `metadata` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[gstNumber]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CreditOfferPlan" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentFor_new" AS ENUM ('SUBSCRIPTION', 'CREDIT', 'OTHER');
ALTER TABLE "payments" ALTER COLUMN "paymentFor" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "paymentFor" TYPE "PaymentFor_new" USING ("paymentFor"::text::"PaymentFor_new");
ALTER TYPE "PaymentFor" RENAME TO "PaymentFor_old";
ALTER TYPE "PaymentFor_new" RENAME TO "PaymentFor";
DROP TYPE "PaymentFor_old";
COMMIT;

-- DropIndex
DROP INDEX "payments_uid_idx";

-- AlterTable
ALTER TABLE "credit_offers" ADD COLUMN     "plan" "CreditOfferPlan" NOT NULL DEFAULT 'BASIC',
ALTER COLUMN "emiFrequency" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "metadata",
ALTER COLUMN "createdTime" DROP NOT NULL,
ALTER COLUMN "paymentFor" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "gstNumber" TEXT,
ALTER COLUMN "referralCode" SET DEFAULT substring(upper(replace(cast(gen_random_uuid() as varchar), '-', '')), 1, 6);

-- CreateIndex
CREATE UNIQUE INDEX "users_gstNumber_key" ON "users"("gstNumber");
