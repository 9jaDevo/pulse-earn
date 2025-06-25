-- Fix profile creation trigger with proper permissions and error handling

-- First, ensure we have the right permissions
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT ALL ON auth.users TO postgres;
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.user_daily_rewards TO postgres;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the trigger function with proper security context
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  profile_name TEXT;
  user_email TEXT;
BEGIN
  -- Get email and name safely
  user_email := COALESCE(NEW.email, '');
  profile_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(user_email, '@', 1),
    'User'
  );
  
  -- Insert profile (bypass RLS by using SECURITY DEFINER)
  INSERT INTO public.profiles (
    id,
    email,
    name,
    avatar_url,
    country,
    role,
    points,
    badges,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_email,
    profile_name,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'country',
    'user'::user_role,
    0,
    ARRAY[]::text[],
    COALESCE(NEW.created_at, NOW()),
    NOW()
  );
  
  -- Insert daily rewards record
  INSERT INTO public.user_daily_rewards (
    user_id,
    trivia_streak,
    spin_streak,
    total_spins,
    total_trivia_completed,
    total_ads_watched,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    0,
    0,
    0,
    0,
    0,
    COALESCE(NEW.created_at, NOW()),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, that's fine
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error in handle_new_user for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Set function owner to postgres for maximum privileges
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies don't interfere with trigger
-- Temporarily disable RLS to recreate policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_rewards DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "System can create profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profile data viewable" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view public profile data" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

DROP POLICY IF EXISTS "System can manage daily rewards" ON user_daily_rewards;
DROP POLICY IF EXISTS "Users can view their own daily rewards" ON user_daily_rewards;
DROP POLICY IF EXISTS "Users can update their own daily rewards" ON user_daily_rewards;
DROP POLICY IF EXISTS "Admins can manage all daily rewards" ON user_daily_rewards;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_rewards ENABLE ROW LEVEL SECURITY;

-- Create new, simple policies for profiles
CREATE POLICY "Public profile data viewable"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create profiles"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for user_daily_rewards
CREATE POLICY "System can manage daily rewards"
  ON user_daily_rewards
  FOR ALL
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view their own daily rewards"
  ON user_daily_rewards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily rewards"
  ON user_daily_rewards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all daily rewards"
  ON user_daily_rewards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_role
    )
  );

-- Create function to fix existing users without profiles
CREATE OR REPLACE FUNCTION public.create_missing_profiles_now()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  missing_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Find auth users without profiles and create them
  FOR user_record IN 
    SELECT 
      au.id,
      au.email,
      au.raw_user_meta_data,
      au.created_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    BEGIN
      -- Create missing profile
      INSERT INTO public.profiles (
        id,
        email,
        name,
        role,
        points,
        badges,
        created_at,
        updated_at
      ) VALUES (
        user_record.id,
        COALESCE(user_record.email, ''),
        COALESCE(
          user_record.raw_user_meta_data->>'name',
          user_record.raw_user_meta_data->>'full_name',
          split_part(COALESCE(user_record.email, ''), '@', 1),
          'User'
        ),
        'user'::user_role,
        0,
        ARRAY[]::text[],
        user_record.created_at,
        NOW()
      );
      
      -- Create missing daily rewards record
      INSERT INTO public.user_daily_rewards (
        user_id,
        created_at,
        updated_at
      ) VALUES (
        user_record.id,
        user_record.created_at,
        NOW()
      ) ON CONFLICT (user_id) DO NOTHING;
      
      missing_count := missing_count + 1;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to create profile for user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN missing_count;
END;
$$;

-- Run the function to create missing profiles
SELECT public.create_missing_profiles_now() as profiles_created;

-- Grant all necessary permissions to ensure everything works
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Ensure the auth schema has proper access
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO postgres;

-- Test that the trigger function is working
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE 'Profile creation trigger is active and ready';
  ELSE
    RAISE WARNING 'Profile creation trigger is not active';
  END IF;
END $$;