/*
  # Add UPDATE policy for transactions table

  1. Problem
    - Users cannot update their own transactions
    - This causes issues with payment processing, especially with Stripe
    - Transaction status updates fail with empty response

  2. Solution
    - Add a specific RLS policy that allows users to update their own transactions
    - This enables client-side payment status updates to work properly
    - Maintains security by restricting updates to the user's own transactions
*/

-- Create policy for users to update their own transactions
CREATE POLICY "Users can update their own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON POLICY "Users can update their own transactions" ON transactions IS 'Allows users to update their own transaction records, needed for payment processing';