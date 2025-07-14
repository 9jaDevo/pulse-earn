/*
  # Alter Transactions and Rewards Tables for Contest Support

  1. Changes to existing tables
    - `transactions` table:
      - Add `transaction_type` enum and column
      - Add `contest_enrollment_id` foreign key column
    - `daily_reward_history` table:
      - Add `contest_prize` to reward type enum

  2. Security
    - Update existing RLS policies if needed
*/

-- Create transaction type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type_enum') THEN
    CREATE TYPE transaction_type_enum AS ENUM (
      'contest_entry',
      'points_purchase', 
      'promoted_poll_payment',
      'payout'
    );
  END IF;
END $$;

-- Add transaction_type column to transactions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'transaction_type'
  ) THEN
    ALTER TABLE transactions ADD COLUMN transaction_type transaction_type_enum;
  END IF;
END $$;

-- Add contest_enrollment_id column to transactions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'contest_enrollment_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN contest_enrollment_id uuid REFERENCES contest_enrollments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add contest_prize to daily_reward_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'contest_prize' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'daily_reward_type')
  ) THEN
    ALTER TYPE daily_reward_type ADD VALUE 'contest_prize';
  END IF;
END $$;