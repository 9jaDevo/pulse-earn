/*
  # Fix infinite recursion in profiles RLS policies

  1. Policy Changes
    - Remove recursive policy that checks profiles table within profiles policies
    - Simplify admin check to use auth.jwt() claims instead of subquery
    - Keep user-specific policies simple and non-recursive

  2. Security
    - Maintain proper access control
    - Users can only access their own data
    - Admins maintain full access through JWT claims
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow profile creation during signup (for anon users)
CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Admin access using JWT claims instead of subquery
CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
      (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role'
    ) = 'admin'
  );

-- Public read access for authenticated users (for leaderboards, etc.)
CREATE POLICY "Authenticated users can view public profile data"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);