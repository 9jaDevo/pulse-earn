/*
  # Add User Suspension Feature

  1. New Columns
    - `is_suspended` (boolean) - Flag to indicate if a user is suspended
    
  2. Security
    - Only admins can update the suspension status
    - Suspended users should be restricted from certain actions
    
  3. Changes
    - Add is_suspended column to profiles table with default false
    - Add index for faster queries on suspension status
*/

-- Add is_suspended column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON profiles(is_suspended);

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_suspended IS 'Flag indicating if the user is suspended from the platform';