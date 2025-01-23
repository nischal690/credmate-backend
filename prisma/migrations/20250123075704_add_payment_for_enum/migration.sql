-- Create PaymentFor enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "PaymentFor" AS ENUM ('SUBSCRIPTION', 'CREDIT', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Modify paymentFor column to use the enum
ALTER TABLE "payments" 
    ALTER COLUMN "paymentFor" TYPE "PaymentFor" 
    USING "paymentFor"::"PaymentFor";
