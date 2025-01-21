-- CreateEnum
CREATE TYPE "PaymentFor" AS ENUM ('SUBSCRIPTION', 'CONTRACT');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "paymentFor" "PaymentFor" NOT NULL DEFAULT 'CONTRACT';
