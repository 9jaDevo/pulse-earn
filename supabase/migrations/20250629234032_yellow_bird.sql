/*
# Add currency column to promoted_polls table

1. Changes
   - Add `currency` column to `promoted_polls` table
   - Set default value to 'USD' for existing records
   - Add check constraint to ensure valid currency codes

2. Notes
   - This fixes the frontend error where the application expects a currency column
   - Existing records will automatically get 'USD' as the default currency
*/

-- Add currency column to promoted_polls table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promoted_polls' AND column_name = 'currency'
  ) THEN
    ALTER TABLE promoted_polls ADD COLUMN currency text NOT NULL DEFAULT 'USD';
    
    -- Add check constraint for valid currency codes
    ALTER TABLE promoted_polls ADD CONSTRAINT promoted_polls_currency_check 
    CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NGN', 'KES', 'GHS', 'ZAR'));
  END IF;
END $$;