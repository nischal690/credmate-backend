-- Step 1: Update BULLET payment credits
DO $$ 
BEGIN
  UPDATE credits
  SET "dueDate" = jsonb_build_object(
    CASE 
      WHEN "timeUnit" = 'DAYS' THEN to_char("createdAt"::date + ("loanTerm" * INTERVAL '1 day'), 'YYYY-MM-DD')
      WHEN "timeUnit" = 'MONTHS' THEN to_char("createdAt"::date + ("loanTerm" * INTERVAL '1 month'), 'YYYY-MM-DD')
      WHEN "timeUnit" = 'YEARS' THEN to_char("createdAt"::date + ("loanTerm" * INTERVAL '1 year'), 'YYYY-MM-DD')
    END,
    CASE 
      WHEN (CASE 
        WHEN "timeUnit" = 'DAYS' THEN ("createdAt"::date + ("loanTerm" * INTERVAL '1 day'))
        WHEN "timeUnit" = 'MONTHS' THEN ("createdAt"::date + ("loanTerm" * INTERVAL '1 month'))
        WHEN "timeUnit" = 'YEARS' THEN ("createdAt"::date + ("loanTerm" * INTERVAL '1 year'))
      END) < CURRENT_DATE THEN 'missed'
      ELSE 'yet_to_pay'
    END
  )
  WHERE "paymentType" = 'BULLET' AND ("dueDate" IS NULL OR "dueDate"::text = '{}');
END $$;

-- Step 2: Create a temporary table to store EMI dates
CREATE TEMPORARY TABLE temp_emi_dates (
  credit_id TEXT,
  payment_dates JSONB
);

-- Step 3: Insert EMI dates for each credit
DO $$
DECLARE
  r RECORD;
  payment_date DATE;
  due_dates JSONB;
  i INTEGER;
BEGIN
  FOR r IN SELECT id, "createdAt", "loanTerm", "emiFrequency" 
           FROM credits 
           WHERE "paymentType" != 'BULLET' AND ("dueDate" IS NULL OR "dueDate"::text = '{}')
  LOOP
    due_dates := '{}'::jsonb;
    FOR i IN 1..r."loanTerm" LOOP
      payment_date := CASE 
        WHEN r."emiFrequency" = 'WEEKLY' THEN (r."createdAt"::date + (i * INTERVAL '1 week'))
        WHEN r."emiFrequency" = 'MONTHLY' THEN (r."createdAt"::date + (i * INTERVAL '1 month'))
        WHEN r."emiFrequency" = 'QUARTERLY' THEN (r."createdAt"::date + (i * INTERVAL '3 month'))
      END;
      
      due_dates := due_dates || jsonb_build_object(
        to_char(payment_date, 'YYYY-MM-DD'),
        CASE WHEN payment_date < CURRENT_DATE THEN 'missed' ELSE 'yet_to_pay' END
      );
    END LOOP;
    
    INSERT INTO temp_emi_dates (credit_id, payment_dates) VALUES (r.id, due_dates);
  END LOOP;
END $$;

-- Step 4: Update EMI credits with their payment dates
UPDATE credits c
SET "dueDate" = t.payment_dates
FROM temp_emi_dates t
WHERE c.id = t.credit_id;

-- Step 5: Clean up
DROP TABLE temp_emi_dates;
