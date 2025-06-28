/*
  # Fix admin profile update permissions

  1. Security
    - Add explicit RLS policy for admins to update any profile
    - This fixes the 406 error when admins try to update user profiles
*/

-- First check if the policy already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can manage all profiles'
  ) THEN
    -- Create policy for admins to manage all profiles
    CREATE POLICY "Admins can manage all profiles" 
    ON profiles
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    );
  END IF;
END
$$;

-- Ensure the service role can manage profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Service role can manage profiles'
  ) THEN
    CREATE POLICY "Service role can manage profiles"
    ON profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END
$$;