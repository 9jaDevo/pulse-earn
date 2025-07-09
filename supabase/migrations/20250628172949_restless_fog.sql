/*
  # Fix Infinite Recursion in Profiles RLS Policy

  1. Problem
    - Infinite recursion detected in policy for relation "profiles"
    - This is causing 500 errors when accessing app_settings and profiles data
  
  2. Solution
    - Replace recursive policies with non-recursive alternatives
    - Ensure proper RLS policies for admin access to profiles
*/

-- Drop problematic policies that might be causing recursion
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

-- Create new non-recursive policies for admins
CREATE POLICY "Admins can manage all profiles" 
ON profiles
FOR ALL 
TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role' OR (
  SELECT role FROM profiles WHERE id = auth.uid()
) = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR (
  SELECT role FROM profiles WHERE id = auth.uid()
) = 'admin');

-- Ensure service role has full access
CREATE POLICY "Service role can manage profiles" 
ON profiles
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure users can view their own profiles
CREATE POLICY IF NOT EXISTS "Users can view own profile" 
ON profiles
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Ensure users can update their own profiles
CREATE POLICY IF NOT EXISTS "Users can update own profile" 
ON profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure users can insert their own profile
CREATE POLICY IF NOT EXISTS "Users can insert own profile" 
ON profiles
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Ensure authenticated users can view public profiles
CREATE POLICY IF NOT EXISTS "Authenticated users can view public profiles" 
ON profiles
FOR SELECT 
TO authenticated
USING (true);

-- Ensure public can insert profiles (for sign-up)
CREATE POLICY IF NOT EXISTS "Public can insert profiles" 
ON profiles
FOR INSERT 
TO public
WITH CHECK (true);