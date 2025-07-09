/*
  # Add Service Role Access to Promoted Polls

  1. Problem
    - Webhooks running as service_role cannot update promoted_polls payment status
    - This causes payment status to remain as "pending" even after successful payment
    - Webhooks are updating the transactions table but not the promoted_polls table

  2. Solution
    - Add RLS policy to allow service_role to update promoted_polls table
    - This enables webhook functions to update payment_status field
    - Maintains security while allowing necessary system operations

  3. Changes
    - Create policy for service_role to update promoted_polls
*/

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Service role can update promoted_polls" ON promoted_polls;

-- Create policy to allow service_role to update promoted_polls
CREATE POLICY "Service role can update promoted_polls"
  ON promoted_polls
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON POLICY "Service role can update promoted_polls" ON promoted_polls IS 'Allows the service_role to update any row in the promoted_polls table, needed for webhook processing.';