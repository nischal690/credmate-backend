-- Update existing referral codes to 6-character alphanumeric format
UPDATE "users"
SET "referralCode" = substring(upper(replace(cast(gen_random_uuid() as varchar), '-', '')), 1, 6)
WHERE length("referralCode") > 6;
