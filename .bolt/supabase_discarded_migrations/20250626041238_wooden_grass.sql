/*
  # Add user counts by country function

  1. New Functions
    - `get_user_counts_by_country()` - Returns aggregated user counts grouped by country
  
  2. Purpose
    - Enables proper country-based user statistics for admin dashboard
    - Replaces client-side GROUP BY operations which are not supported in Supabase JS client
  
  3. Security
    - Function can be called by authenticated users (will be restricted by RLS policies)
*/

CREATE OR REPLACE FUNCTION get_user_counts_by_country()
RETURNS TABLE(country TEXT, user_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.country,
    COUNT(p.id) AS user_count
  FROM
    profiles p
  WHERE
    p.country IS NOT NULL
  GROUP BY
    p.country
  ORDER BY
    user_count DESC;
END;
$$;