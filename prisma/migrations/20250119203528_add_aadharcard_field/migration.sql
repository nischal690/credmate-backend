-- AlterTable
ALTER TABLE "users" ADD COLUMN     "aadharcard" TEXT,
ALTER COLUMN "referralCode" SET DEFAULT substring(upper(replace(cast(gen_random_uuid() as varchar), '-', '')), 1, 6);
