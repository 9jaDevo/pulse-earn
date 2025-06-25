/*
  # Add function to get category counts

  1. New Function
    - `get_category_counts` - Returns counts of polls by category
    - Used for analytics and statistics

  2. Implementation
    - Counts active polls grouped by category
    - Returns sorted results with category name and count
    - Optimized for performance with proper indexing
*/

-- Create function to get category counts
CREATE OR REPLACE FUNCTION get_category_counts()
RETURNS TABLE(category text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.category, 'General') as category,
    COUNT(p.id)::bigint as count
  FROM 
    polls p
  WHERE 
    p.is_active = true
  GROUP BY 
    COALESCE(p.category, 'General')
  ORDER BY 
    count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_category_counts() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_category_counts() IS 'Returns counts of polls by category for analytics';