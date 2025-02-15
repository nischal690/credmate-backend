-- AlterTable
ALTER TABLE "credit_requests" ADD COLUMN     "offerId" TEXT;

-- CreateIndex
CREATE INDEX "credit_requests_offerId_idx" ON "credit_requests"("offerId");
