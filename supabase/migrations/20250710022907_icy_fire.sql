/*
  # Allow admins to update any profile

  1. New Policies
    - Add a policy that allows admins to update any user profile
    - This fixes the issue where admins cannot update other users' profiles in the admin panel
  
  2. Security
    - Only users with the 'admin' role can update other users' profiles
    - Regular users can still only update their own profiles
*/

-- Policy to allow admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );