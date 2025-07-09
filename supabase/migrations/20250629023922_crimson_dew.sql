/*
  # Add INSERT policy for transactions table

  1. Security
    - Add policy to allow users to insert their own transactions
    - Users can only insert transactions where user_id matches their auth.uid()
    - This enables payment processing for promoted polls and other features
*/

-- Add INSERT policy for users to create their own transactions
CREATE POLICY "Users can insert their own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);