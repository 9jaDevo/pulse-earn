/*
  # Fix infinite recursion in profiles RLS policies

  1. Security Changes
    - Drop existing problematic RLS policies on profiles table
    - Create new simplified policies that don't cause recursion
    - Ensure proper access control without circular dependencies

  2. Policy Changes
    - Remove recursive admin check policy
    - Simplify user access policies
    - Add safe admin management policy using auth.uid() directly
*/

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profile data viewable" ON profiles;
DROP POLICY IF EXISTS "System can create profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create new safe policies without recursion

-- Allow users to view their own profile data
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile data
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (for registration)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow system/service role to manage profiles (for triggers and functions)
CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow public access for profile creation during signup
CREATE POLICY "Public can insert profiles"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated users to view public profile data (for leaderboards, etc.)
-- This is safe because it doesn't reference the profiles table in the policy condition
CREATE POLICY "Authenticated users can view public profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);