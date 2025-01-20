-- Update all existing users to have aadharcard as null
UPDATE "users" SET "aadharcard" = null WHERE "aadharcard" IS NOT null;
