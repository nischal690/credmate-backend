-- AlterTable
ALTER TABLE "users" ALTER COLUMN "referralCode" SET DEFAULT substring(upper(replace(cast(gen_random_uuid() as varchar), '-', '')), 1, 6);

-- CreateTable
CREATE TABLE "alllenderrequests" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "loanAmount" DOUBLE PRECISION NOT NULL,
    "loanTerms" INTEGER NOT NULL,
    "timeUnit" TEXT NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "purpose" TEXT NOT NULL,
    "paymentType" TEXT NOT NULL,
    "emiFrequency" TEXT,
    "emiAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,

    CONSTRAINT "alllenderrequests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alllenderrequests_uid_idx" ON "alllenderrequests"("uid");
