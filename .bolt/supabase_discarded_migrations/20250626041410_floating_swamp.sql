/*
  # Add User Counts By Country Function

  1. New Function
    - `get_user_counts_by_country` - Returns counts of users by country
    - Used for admin dashboard analytics
    - Optimized with proper indexing and error handling

  2. Implementation
    - Counts users grouped by country
    - Returns sorted results with country name and count
    - Includes proper error handling to prevent timeouts
*/

-- Create function with better error handling and timeout prevention
CREATE OR REPLACE FUNCTION get_user_counts_by_country()
RETURNS TABLE(country TEXT, user_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '5s'  -- Prevent long-running queries
AS $$
BEGIN
  -- Make sure we have an index on country for better performance
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'profiles' AND indexname = 'profiles_country_idx'
  ) THEN
    CREATE INDEX IF NOT EXISTS profiles_country_idx ON profiles(country);
  END IF;

  -- Return the query results with proper error handling
  BEGIN
    RETURN QUERY
    SELECT
      COALESCE(p.country, 'Unknown') AS country,
      COUNT(p.id)::BIGINT AS user_count
    FROM
      profiles p
    WHERE
      p.country IS NOT NULL
    GROUP BY
      COALESCE(p.country, 'Unknown')
    ORDER BY
      user_count DESC
    LIMIT 100;  -- Add a reasonable limit to prevent excessive results
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error in get_user_counts_by_country: %', SQLERRM;
      -- Return empty result set on error
      RETURN QUERY SELECT NULL::TEXT, 0::BIGINT WHERE FALSE;
  END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_counts_by_country() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_user_counts_by_country() IS 'Returns counts of users by country for admin analytics';