/*
  # Fix get_referral_stats function

  1. Database Functions
    - Fix ambiguous column reference in get_referral_stats function
    - Properly qualify all column references with table aliases

  2. Changes
    - Add proper table aliases to avoid ambiguous column references
    - Ensure all columns are properly qualified in the function
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_referral_stats(uuid);

-- Create the corrected function with proper column qualification
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id uuid)
RETURNS TABLE (
  total_referrals integer,
  active_referrals integer,
  total_points_earned bigint,
  conversion_rate numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer as total_referrals,
    COUNT(CASE WHEN p.is_suspended = false THEN 1 END)::integer as active_referrals,
    COALESCE(SUM(p.points), 0)::bigint as total_points_earned,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(CASE WHEN p.is_suspended = false THEN 1 END)::numeric / COUNT(*)::numeric * 100)
      ELSE 0 
    END as conversion_rate
  FROM profiles p
  WHERE p.referred_by = p_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_referral_stats(uuid) TO authenticated;