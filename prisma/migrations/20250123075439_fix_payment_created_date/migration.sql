-- Rename createdDate to createdAt
ALTER TABLE "payments" RENAME COLUMN "createdDate" TO "createdAt";

-- Add updatedAt column if it doesn't exist
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
