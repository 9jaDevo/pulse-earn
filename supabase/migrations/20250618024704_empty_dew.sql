/*
  # Fix Profile Creation Issue

  1. Database Changes
    - Update the handle_new_user trigger function to be more robust
    - Add better error handling and logging
    - Ensure the trigger is properly attached to auth.users
    - Add a fallback mechanism for profile creation

  2. Security
    - Maintain RLS policies
    - Ensure proper permissions for profile creation
*/

-- First, let's check and recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  profile_name TEXT;
  user_email TEXT;
  generated_referral_code TEXT;
  referrer_profile_id UUID;
  referred_by_code TEXT;
  user_country TEXT;
BEGIN
  -- Log the start of profile creation
  RAISE LOG 'Creating profile for user: %', NEW.id;

  -- Get email and name safely with better fallbacks
  user_email := COALESCE(NEW.email, '');
  
  -- Extract name from various possible sources
  profile_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    CASE 
      WHEN user_email != '' THEN split_part(user_email, '@', 1)
      ELSE 'User'
    END
  );

  -- Get country from metadata
  user_country := NEW.raw_user_meta_data->>'country';

  -- Generate a unique referral code for the new user
  BEGIN
    generated_referral_code := public.generate_unique_short_code(8);
  EXCEPTION
    WHEN OTHERS THEN
      -- If referral code generation fails, create a simple one
      generated_referral_code := 'USER' || substr(replace(NEW.id::text, '-', ''), 1, 4);
      RAISE WARNING 'Failed to generate unique referral code, using fallback: %', generated_referral_code;
  END;

  -- Check for incoming referral code
  referred_by_code := NEW.raw_user_meta_data->>'referred_by_code';
  referrer_profile_id := NULL;

  IF referred_by_code IS NOT NULL AND referred_by_code != '' THEN
    BEGIN
      SELECT id INTO referrer_profile_id
      FROM public.profiles
      WHERE referral_code = referred_by_code;
      
      RAISE LOG 'Found referrer for code %: %', referred_by_code, referrer_profile_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Error looking up referrer with code %: %', referred_by_code, SQLERRM;
    END;
  END IF;

  -- Insert profile with explicit error handling
  BEGIN
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
      updated_at,
      referral_code,
      referred_by
    ) VALUES (
      NEW.id,
      user_email,
      profile_name,
      NEW.raw_user_meta_data->>'avatar_url',
      user_country,
      'user'::user_role,
      0,
      ARRAY[]::text[],
      COALESCE(NEW.created_at, NOW()),
      NOW(),
      generated_referral_code,
      referrer_profile_id
    );
    
    RAISE LOG 'Successfully created profile for user: %', NEW.id;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, update it instead
      RAISE LOG 'Profile already exists for user %, updating instead', NEW.id;
      
      UPDATE public.profiles 
      SET 
        email = user_email,
        name = COALESCE(profile_name, name),
        avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
        country = COALESCE(user_country, country),
        updated_at = NOW(),
        referral_code = COALESCE(referral_code, generated_referral_code),
        referred_by = COALESCE(referred_by, referrer_profile_id)
      WHERE id = NEW.id;
      
    WHEN OTHERS THEN
      RAISE WARNING 'Error creating profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
      -- Don't fail the user creation, just log the error
  END;

  -- Insert daily rewards record with error handling
  BEGIN
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
    
    RAISE LOG 'Successfully created daily rewards record for user: %', NEW.id;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Daily rewards record already exists, that's fine
      RAISE LOG 'Daily rewards record already exists for user: %', NEW.id;
    WHEN OTHERS THEN
      RAISE WARNING 'Error creating daily rewards for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  END;

  -- Award referral bonuses if referred
  IF referrer_profile_id IS NOT NULL THEN
    BEGIN
      PERFORM public.award_referral_bonus(referrer_profile_id, NEW.id);
      RAISE LOG 'Successfully awarded referral bonus for user: %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Error awarding referral bonus for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also create a trigger for profile creation on the profiles table itself
DROP TRIGGER IF EXISTS on_profile_created_rewards ON public.profiles;

CREATE TRIGGER on_profile_created_rewards
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_rewards();

-- Create the handle_new_user_rewards function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_new_user_rewards()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure user_daily_rewards record exists
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
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user_rewards for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create a function to manually create missing profiles for existing auth users
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  created_count INTEGER := 0;
  profile_name TEXT;
  generated_referral_code TEXT;
BEGIN
  -- Find auth users without profiles
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data, au.created_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    BEGIN
      -- Extract name
      profile_name := COALESCE(
        user_record.raw_user_meta_data->>'name',
        user_record.raw_user_meta_data->>'full_name',
        user_record.raw_user_meta_data->>'display_name',
        CASE 
          WHEN user_record.email IS NOT NULL THEN split_part(user_record.email, '@', 1)
          ELSE 'User'
        END
      );

      -- Generate referral code
      generated_referral_code := public.generate_unique_short_code(8);

      -- Create profile
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
        updated_at,
        referral_code,
        referred_by
      ) VALUES (
        user_record.id,
        COALESCE(user_record.email, ''),
        profile_name,
        user_record.raw_user_meta_data->>'avatar_url',
        user_record.raw_user_meta_data->>'country',
        'user'::user_role,
        0,
        ARRAY[]::text[],
        COALESCE(user_record.created_at, NOW()),
        NOW(),
        generated_referral_code,
        NULL
      );

      -- Create daily rewards record
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
        user_record.id,
        0,
        0,
        0,
        0,
        0,
        COALESCE(user_record.created_at, NOW()),
        NOW()
      )
      ON CONFLICT (user_id) DO NOTHING;

      created_count := created_count + 1;
      RAISE LOG 'Created missing profile for user: %', user_record.id;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Error creating profile for user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to create any missing profiles
SELECT public.create_missing_profiles() as profiles_created;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO public;
GRANT EXECUTE ON FUNCTION public.handle_new_user_rewards() TO public;
GRANT EXECUTE ON FUNCTION public.create_missing_profiles() TO public;

-- Ensure RLS policies allow profile creation
DROP POLICY IF EXISTS "System can create profiles" ON public.profiles;

CREATE POLICY "System can create profiles"
  ON public.profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Add a policy for authenticated users to insert their own profile
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;

CREATE POLICY "Users can create their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the generate_unique_short_code function is robust
CREATE OR REPLACE FUNCTION public.generate_unique_short_code(length INT DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  charset TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT;
  i INT;
  is_unique BOOLEAN;
  charset_length INT;
  random_index INT;
  max_attempts INT := 100;
  attempt_count INT := 0;
BEGIN
  charset_length := length(charset);
  
  LOOP
    code := '';
    FOR i IN 1..length LOOP
      random_index := (floor(random() * charset_length) + 1)::INT;
      code := code || substr(charset, random_index, 1);
    END LOOP;

    -- Check if the generated code is unique
    SELECT NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code) INTO is_unique;
    
    IF is_unique THEN
      RETURN code;
    END IF;
    
    attempt_count := attempt_count + 1;
    IF attempt_count >= max_attempts THEN
      -- Fallback to timestamp-based code if we can't generate unique code
      RETURN 'USR' || substr(replace(extract(epoch from now())::text, '.', ''), -5);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add some helpful functions for debugging
CREATE OR REPLACE FUNCTION public.debug_user_creation(user_email TEXT)
RETURNS TABLE(
  auth_user_exists BOOLEAN,
  profile_exists BOOLEAN,
  daily_rewards_exists BOOLEAN,
  user_id UUID
) AS $$
DECLARE
  found_user_id UUID;
BEGIN
  -- Find user ID by email
  SELECT id INTO found_user_id FROM auth.users WHERE email = user_email;
  
  IF found_user_id IS NULL THEN
    RETURN QUERY SELECT false, false, false, NULL::UUID;
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    true as auth_user_exists,
    EXISTS(SELECT 1 FROM public.profiles WHERE id = found_user_id) as profile_exists,
    EXISTS(SELECT 1 FROM public.user_daily_rewards WHERE user_id = found_user_id) as daily_rewards_exists,
    found_user_id as user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.debug_user_creation(TEXT) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create user profile and daily rewards when auth user is created';
COMMENT ON FUNCTION public.create_missing_profiles() IS 'Utility function to create profiles for existing auth users who are missing profiles';
COMMENT ON FUNCTION public.debug_user_creation(TEXT) IS 'Debug function to check user creation status by email';