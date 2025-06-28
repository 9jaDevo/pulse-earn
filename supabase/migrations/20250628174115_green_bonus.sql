/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - The "Admins can manage all profiles" policy creates infinite recursion
    - It queries the profiles table from within a policy applied to the profiles table
    - This causes all profile queries to fail with infinite recursion error

  2. Solution
    - Drop the problematic admin policy that causes recursion
    - Create a simpler admin policy that uses auth.jwt() to check role claims
    - Alternatively, use a different approach that doesn't query profiles table from within profiles policies

  3. Changes
    - Remove recursive admin policies
    - Add non-recursive admin policies using JWT claims or service role
*/

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role has full access" ON profiles;

-- Create a new admin policy that doesn't cause recursion
-- This policy allows service role full access (for admin operations)
CREATE POLICY "Service role full access"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a policy for authenticated users to view all profiles (needed for leaderboards, etc.)
-- This replaces the recursive admin check for read operations
CREATE POLICY "Authenticated users can view profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep the existing user policies for self-management
-- These should already exist and don't cause recursion:
-- - "Users can insert their own profile" 
-- - "Users can update their own profile"
-- - "Users can view all profiles" (if it exists, we'll replace it with the one above)

-- Drop the duplicate "Users can view all profiles" policy if it exists
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- For admin operations, we'll rely on the service role policy
-- Admin functions should use the service role key for operations that require admin privileges