-- Update all BULLET payment credits
UPDATE credits
SET "dueDate" = jsonb_build_object(
  (CASE 
    WHEN "timeUnit" = 'DAYS' THEN ("createdAt"::date + ("loanTerm" * INTERVAL '1 day'))::text
    WHEN "timeUnit" = 'MONTHS' THEN ("createdAt"::date + ("loanTerm" * INTERVAL '1 month'))::text
    WHEN "timeUnit" = 'YEARS' THEN ("createdAt"::date + ("loanTerm" * INTERVAL '1 year'))::text
  END),
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

-- Create a function to generate EMI dates
CREATE OR REPLACE FUNCTION generate_emi_dates(
  start_date timestamp,
  loan_term int,
  emi_frequency text
) RETURNS TABLE (
  payment_date date,
  status text
) AS $$
BEGIN
  FOR i IN 1..loan_term LOOP
    RETURN QUERY
    SELECT 
      (CASE 
        WHEN emi_frequency = 'WEEKLY' THEN (start_date::date + (i * INTERVAL '1 week'))
        WHEN emi_frequency = 'MONTHLY' THEN (start_date::date + (i * INTERVAL '1 month'))
        WHEN emi_frequency = 'QUARTERLY' THEN (start_date::date + (i * INTERVAL '3 month'))
      END) as payment_date,
      CASE 
        WHEN (CASE 
          WHEN emi_frequency = 'WEEKLY' THEN (start_date::date + (i * INTERVAL '1 week'))
          WHEN emi_frequency = 'MONTHLY' THEN (start_date::date + (i * INTERVAL '1 month'))
          WHEN emi_frequency = 'QUARTERLY' THEN (start_date::date + (i * INTERVAL '3 month'))
        END) < CURRENT_DATE THEN 'missed'
        ELSE 'yet_to_pay'
      END as status;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update all EMI payment credits
UPDATE credits c
SET "dueDate" = (
  SELECT jsonb_object_agg(payment_date::text, status)
  FROM generate_emi_dates(c."createdAt", c."loanTerm", c."emiFrequency") 
)
WHERE "paymentType" != 'BULLET' AND ("dueDate" IS NULL OR "dueDate"::text = '{}');

-- Drop the function as it's no longer needed
DROP FUNCTION generate_emi_dates;
