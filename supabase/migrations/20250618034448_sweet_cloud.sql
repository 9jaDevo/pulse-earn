/*
  # Admin Dashboard Policies and Functions

  1. Security
    - Admin policies for all tables
    - Role-based access control
    - Secure admin functions

  2. Functions
    - promote_user_to_admin: Promote users to admin role
    - get_platform_stats: Platform statistics for dashboard
    - get_user_management_stats: User management data

  3. Performance
    - Indexes for admin queries
    - Optimized policy checks
*/

-- Drop existing admin policies if they exist to avoid conflicts
DO $$ 
BEGIN
  -- Drop existing admin policies for profiles
  DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
  
  -- Drop existing admin policies for user_daily_rewards  
  DROP POLICY IF EXISTS "Admins can manage all daily rewards" ON user_daily_rewards;
  
  -- Drop existing admin policies for daily_reward_history
  DROP POLICY IF EXISTS "Admins can manage all reward history" ON daily_reward_history;
  
  -- Drop existing admin policies for polls
  DROP POLICY IF EXISTS "Admins can manage all polls" ON polls;
  
  -- Drop existing admin policies for poll_votes
  DROP POLICY IF EXISTS "Admins can manage all poll votes" ON poll_votes;
  
  -- Drop existing admin policies for trivia_questions
  DROP POLICY IF EXISTS "Admins can manage trivia questions" ON trivia_questions;
  
  -- Drop existing admin policies for badges
  DROP POLICY IF EXISTS "Admins can manage all badges" ON badges;
  
  -- Drop existing admin policies for moderator_actions
  DROP POLICY IF EXISTS "Admins can manage all moderator actions" ON moderator_actions;
  
  -- Drop existing admin policies for ambassadors
  DROP POLICY IF EXISTS "Admins can manage all ambassadors" ON ambassadors;
  
  -- Drop existing admin policies for country_metrics
  DROP POLICY IF EXISTS "Admins can manage all country metrics" ON country_metrics;
END $$;

-- Create admin policies for all tables
-- Profiles table admin policies
CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- User daily rewards admin policies
CREATE POLICY "Admins can manage all daily rewards"
  ON user_daily_rewards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Daily reward history admin policies
CREATE POLICY "Admins can manage all reward history"
  ON daily_reward_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Polls admin policies
CREATE POLICY "Admins can manage all polls"
  ON polls
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Poll votes admin policies
CREATE POLICY "Admins can manage all poll votes"
  ON poll_votes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Trivia questions admin policies
CREATE POLICY "Admins can manage trivia questions"
  ON trivia_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Badges admin policies
CREATE POLICY "Admins can manage all badges"
  ON badges
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Moderator actions admin policies
CREATE POLICY "Admins can manage all moderator actions"
  ON moderator_actions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Ambassadors admin policies
CREATE POLICY "Admins can manage all ambassadors"
  ON ambassadors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Country metrics admin policies
CREATE POLICY "Admins can manage all country metrics"
  ON country_metrics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Create or replace admin functions
-- Function to promote a user to admin (for initial setup)
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  update_count INTEGER;
BEGIN
  -- Update user role to admin
  UPDATE public.profiles 
  SET role = 'admin'::user_role,
      updated_at = NOW()
  WHERE email = user_email;
  
  -- Get the number of rows affected
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  IF update_count > 0 THEN
    RAISE LOG 'User % promoted to admin successfully', user_email;
    RETURN TRUE;
  ELSE
    RAISE WARNING 'User with email % not found', user_email;
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get platform statistics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE(
  total_users INTEGER,
  active_polls INTEGER,
  total_points_distributed BIGINT,
  total_votes INTEGER,
  new_users_today INTEGER,
  polls_created_today INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM profiles) as total_users,
    (SELECT COUNT(*)::INTEGER FROM polls WHERE is_active = true) as active_polls,
    (SELECT COALESCE(SUM(points), 0)::BIGINT FROM profiles) as total_points_distributed,
    (SELECT COUNT(*)::INTEGER FROM poll_votes) as total_votes,
    (SELECT COUNT(*)::INTEGER FROM profiles WHERE created_at::date = CURRENT_DATE) as new_users_today,
    (SELECT COUNT(*)::INTEGER FROM polls WHERE created_at::date = CURRENT_DATE) as polls_created_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user management data for admin dashboard
CREATE OR REPLACE FUNCTION public.get_user_management_stats()
RETURNS TABLE(
  total_users INTEGER,
  users_by_role JSONB,
  recent_signups INTEGER,
  active_users_today INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM profiles) as total_users,
    (SELECT jsonb_object_agg(role, count) FROM (
      SELECT role, COUNT(*)::INTEGER as count 
      FROM profiles 
      GROUP BY role
    ) role_counts) as users_by_role,
    (SELECT COUNT(*)::INTEGER FROM profiles WHERE created_at >= NOW() - INTERVAL '7 days') as recent_signups,
    (SELECT COUNT(DISTINCT user_id)::INTEGER FROM daily_reward_history WHERE created_at::date = CURRENT_DATE) as active_users_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get detailed user information for admin management
CREATE OR REPLACE FUNCTION public.get_user_details(user_id_param UUID DEFAULT NULL, limit_param INTEGER DEFAULT 50)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  country TEXT,
  role user_role,
  points INTEGER,
  badges TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_active TIMESTAMPTZ
) AS $$
BEGIN
  IF user_id_param IS NOT NULL THEN
    -- Return specific user
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.name,
      p.country,
      p.role,
      p.points,
      p.badges,
      p.created_at,
      p.updated_at,
      (SELECT MAX(drh.created_at) FROM daily_reward_history drh WHERE drh.user_id = p.id) as last_active
    FROM profiles p
    WHERE p.id = user_id_param;
  ELSE
    -- Return paginated list of users
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.name,
      p.country,
      p.role,
      p.points,
      p.badges,
      p.created_at,
      p.updated_at,
      (SELECT MAX(drh.created_at) FROM daily_reward_history drh WHERE drh.user_id = p.id) as last_active
    FROM profiles p
    ORDER BY p.created_at DESC
    LIMIT limit_param;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user role (admin only)
CREATE OR REPLACE FUNCTION public.update_user_role(user_id_param UUID, new_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
  update_count INTEGER;
BEGIN
  -- Update user role
  UPDATE public.profiles 
  SET role = new_role,
      updated_at = NOW()
  WHERE id = user_id_param;
  
  -- Get the number of rows affected
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  IF update_count > 0 THEN
    RAISE LOG 'User % role updated to % successfully', user_id_param, new_role;
    RETURN TRUE;
  ELSE
    RAISE WARNING 'User with ID % not found', user_id_param;
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_management_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_details(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, user_role) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.promote_user_to_admin(TEXT) IS 'Promotes a user to admin role by email address';
COMMENT ON FUNCTION public.get_platform_stats() IS 'Returns platform statistics for admin dashboard';
COMMENT ON FUNCTION public.get_user_management_stats() IS 'Returns user management statistics for admin dashboard';
COMMENT ON FUNCTION public.get_user_details(UUID, INTEGER) IS 'Returns detailed user information for admin management';
COMMENT ON FUNCTION public.update_user_role(UUID, user_role) IS 'Updates a user role (admin only)';

-- Create indexes for better admin query performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_profiles_role_created ON public.profiles(role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_polls_active_created ON public.polls(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reward_history_created ON public.daily_reward_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderator_actions_created ON public.moderator_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email_role ON public.profiles(email, role);
CREATE INDEX IF NOT EXISTS idx_poll_votes_created ON public.poll_votes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reward_history_user_date ON public.daily_reward_history(user_id, created_at DESC);

-- Add policy comments for documentation
COMMENT ON POLICY "Admins can manage all profiles" ON profiles IS 'Allows admin users to perform all operations on profiles table';
COMMENT ON POLICY "Admins can manage all daily rewards" ON user_daily_rewards IS 'Allows admin users to manage daily rewards for all users';
COMMENT ON POLICY "Admins can manage all reward history" ON daily_reward_history IS 'Allows admin users to view and manage reward history';
COMMENT ON POLICY "Admins can manage all polls" ON polls IS 'Allows admin users to manage all polls';
COMMENT ON POLICY "Admins can manage all poll votes" ON poll_votes IS 'Allows admin users to view and manage poll votes';
COMMENT ON POLICY "Admins can manage trivia questions" ON trivia_questions IS 'Allows admin users to manage trivia questions';
COMMENT ON POLICY "Admins can manage all badges" ON badges IS 'Allows admin users to manage badge system';
COMMENT ON POLICY "Admins can manage all moderator actions" ON moderator_actions IS 'Allows admin users to view and manage moderator actions';
COMMENT ON POLICY "Admins can manage all ambassadors" ON ambassadors IS 'Allows admin users to manage ambassador program';
COMMENT ON POLICY "Admins can manage all country metrics" ON country_metrics IS 'Allows admin users to view and manage country metrics';