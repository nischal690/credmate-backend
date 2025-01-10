-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "requestRaised" BOOLEAN NOT NULL DEFAULT false,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdTime" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payments_uid_idx" ON "payments"("uid");
