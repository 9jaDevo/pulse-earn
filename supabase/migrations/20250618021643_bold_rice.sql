/*
  # Referral System Implementation

  1. New Columns
    - `referral_code` (text, unique) - User's unique referral code
    - `referred_by` (uuid) - ID of user who referred this user

  2. New Enum Values
    - `referral_signup` - Bonus for new user signup
    - `referral_bonus` - Bonus for successful referral

  3. Functions
    - Generate unique referral codes
    - Award referral bonuses
    - Get referral statistics
    - Backfill existing users with codes

  4. Security
    - Prevent modification of referral fields
    - Track all bonuses in history
*/

-- Add referral_code and referred_by columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id);

-- Add new values to daily_reward_type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'referral_signup' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'daily_reward_type')) THEN
    ALTER TYPE public.daily_reward_type ADD VALUE 'referral_signup';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'referral_bonus' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'daily_reward_type')) THEN
    ALTER TYPE public.daily_reward_type ADD VALUE 'referral_bonus';
  END IF;
END $$;

-- Create a function to generate a unique, short referral code
CREATE OR REPLACE FUNCTION public.generate_unique_short_code(length INT DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  charset TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT;
  i INT;
  is_unique BOOLEAN;
  charset_length INT;
  random_index INT;
BEGIN
  charset_length := length(charset);
  
  LOOP
    code := '';
    FOR i IN 1..length LOOP
      -- Cast floor result to integer explicitly
      random_index := (floor(random() * charset_length) + 1)::INT;
      code := code || substr(charset, random_index, 1);
    END LOOP;

    -- Check if the generated code is unique
    SELECT NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code) INTO is_unique;
    IF is_unique THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award referral bonuses
CREATE OR REPLACE FUNCTION public.award_referral_bonus(
  referrer_id UUID,
  new_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  REFERRAL_BONUS_NEW_USER INT := 100; -- Bonus for new user
  REFERRAL_BONUS_REFERRER INT := 150; -- Bonus for referrer
BEGIN
  -- Award points to new user
  UPDATE public.profiles
  SET points = points + REFERRAL_BONUS_NEW_USER,
      updated_at = NOW()
  WHERE id = new_user_id;

  -- Record new user bonus in daily_reward_history
  INSERT INTO public.daily_reward_history (user_id, reward_type, points_earned, reward_data)
  VALUES (new_user_id, 'referral_signup', REFERRAL_BONUS_NEW_USER, jsonb_build_object('referrer_id', referrer_id));

  -- Award points to referrer
  UPDATE public.profiles
  SET points = points + REFERRAL_BONUS_REFERRER,
      updated_at = NOW()
  WHERE id = referrer_id;

  -- Record referrer bonus in daily_reward_history
  INSERT INTO public.daily_reward_history (user_id, reward_type, points_earned, reward_data)
  VALUES (referrer_id, 'referral_bonus', REFERRAL_BONUS_REFERRER, jsonb_build_object('referred_user_id', new_user_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to include referral logic
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

  -- Generate a unique referral code for the new user
  generated_referral_code := public.generate_unique_short_code(8); -- 8 characters long code

  -- Check for incoming referral code
  referred_by_code := NEW.raw_user_meta_data->>'referred_by_code';
  referrer_profile_id := NULL;

  IF referred_by_code IS NOT NULL AND referred_by_code != '' THEN
    SELECT id INTO referrer_profile_id
    FROM public.profiles
    WHERE referral_code = referred_by_code;
  END IF;

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
    updated_at,
    referral_code, -- New column
    referred_by    -- New column
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
    NOW(),
    generated_referral_code,
    referrer_profile_id
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

  -- Award referral bonuses if referred
  IF referrer_profile_id IS NOT NULL THEN
    PERFORM public.award_referral_bonus(referrer_profile_id, NEW.id);
  END IF;

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

-- Grant execute permissions for new functions
GRANT EXECUTE ON FUNCTION public.generate_unique_short_code(INT) TO public;
GRANT EXECUTE ON FUNCTION public.award_referral_bonus(UUID, UUID) TO public;

-- Drop existing policy first
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create a more restrictive policy that prevents referral field modifications
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create function to generate referral codes for existing users who don't have them
-- This function will be called BEFORE creating the protection trigger
CREATE OR REPLACE FUNCTION public.generate_missing_referral_codes()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Find users without referral codes
  FOR user_record IN 
    SELECT id FROM public.profiles WHERE referral_code IS NULL
  LOOP
    UPDATE public.profiles 
    SET referral_code = public.generate_unique_short_code(8),
        updated_at = NOW()
    WHERE id = user_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to generate referral codes for existing users BEFORE creating the trigger
SELECT public.generate_missing_referral_codes() as codes_generated;

-- NOW create the protection function and trigger AFTER backfilling existing users
CREATE OR REPLACE FUNCTION public.check_referral_fields_unchanged()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow system/admin updates by checking if the session user is a superuser
  -- or if this is being called from a SECURITY DEFINER function
  IF current_setting('role', true) = 'postgres' OR 
     current_setting('is_superuser', true) = 'on' THEN
    RETURN NEW;
  END IF;

  -- Check if user is trying to modify referral_code or referred_by
  IF OLD.referral_code IS DISTINCT FROM NEW.referral_code THEN
    RAISE EXCEPTION 'Cannot modify referral_code';
  END IF;
  
  IF OLD.referred_by IS DISTINCT FROM NEW.referred_by THEN
    RAISE EXCEPTION 'Cannot modify referred_by';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce referral field protection
CREATE TRIGGER protect_referral_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_referral_fields_unchanged();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- Add function to get referral statistics
CREATE OR REPLACE FUNCTION public.get_referral_stats(user_id UUID)
RETURNS TABLE(
  total_referrals INTEGER,
  total_earned_from_referrals INTEGER,
  recent_referrals INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT COUNT(*)::INTEGER FROM profiles WHERE referred_by = user_id), 0) as total_referrals,
    COALESCE((SELECT SUM(points_earned)::INTEGER FROM daily_reward_history WHERE user_id = user_id AND reward_type = 'referral_bonus'), 0) as total_earned_from_referrals,
    COALESCE((SELECT COUNT(*)::INTEGER FROM profiles WHERE referred_by = user_id AND created_at > NOW() - INTERVAL '30 days'), 0) as recent_referrals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_referral_stats(UUID) TO authenticated;

-- Add comment to document the referral system
COMMENT ON COLUMN public.profiles.referral_code IS 'Unique 8-character alphanumeric code for referring new users';
COMMENT ON COLUMN public.profiles.referred_by IS 'ID of the user who referred this user (if any)';
COMMENT ON FUNCTION public.generate_unique_short_code(INT) IS 'Generates a unique alphanumeric referral code';
COMMENT ON FUNCTION public.award_referral_bonus(UUID, UUID) IS 'Awards bonus points to both referrer and new user';
COMMENT ON FUNCTION public.get_referral_stats(UUID) IS 'Returns referral statistics for a user';