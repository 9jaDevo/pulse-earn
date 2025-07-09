/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Current RLS policies on profiles table are causing infinite recursion
    - This happens when policies query the profiles table to check user roles
    - The recursion occurs because the policy evaluation itself triggers another policy check

  2. Solution
    - Remove problematic policies that cause recursion
    - Recreate simplified policies that don't reference the profiles table within themselves
    - Use auth.uid() directly for user identification
    - For admin operations, rely on service role or simplified checks

  3. Changes
    - Drop all existing policies on profiles table
    - Create new, non-recursive policies
    - Ensure users can manage their own profiles
    - Allow public profile viewing for authenticated users
    - Enable profile creation during signup
*/

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON profiles;
DROP POLICY IF EXISTS "Public can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new, simplified policies that don't cause recursion

-- Allow users to view all profiles (for leaderboards, etc.)
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow public/anon users to insert profiles (needed for signup process)
CREATE POLICY "Public can create profiles"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow service role full access (for admin operations and system functions)
CREATE POLICY "Service role has full access"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Note: We removed the recursive admin policies that were checking profiles.role
-- Admin operations should be handled through the service role or application logic
-- rather than through RLS policies that query the same table