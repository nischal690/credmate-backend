-- AlterTable
ALTER TABLE "users" ADD COLUMN     "joinedReferralCode" TEXT,
ALTER COLUMN "referralCode" SET DEFAULT substring(upper(replace(cast(gen_random_uuid() as varchar), '-', '')), 1, 6);
