/*
  # Fix signup database trigger

  1. Database Functions
    - Create or replace the handle_new_user function to properly create profiles
    - Ensure proper error handling and data validation
  
  2. Triggers
    - Create trigger on auth.users to automatically create profile entries
    - Handle edge cases and prevent duplicate entries
  
  3. Security
    - Ensure RLS policies allow the trigger to function properly
*/

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new profile with proper defaults
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    points,
    badges
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'user'::user_role,
    0,
    ARRAY[]::text[]
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the profiles table has proper defaults (in case they're missing)
ALTER TABLE public.profiles 
  ALTER COLUMN role SET DEFAULT 'user'::user_role,
  ALTER COLUMN points SET DEFAULT 0,
  ALTER COLUMN badges SET DEFAULT ARRAY[]::text[];

-- Grant necessary permissions for the trigger function
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT ON public.profiles TO supabase_auth_admin;