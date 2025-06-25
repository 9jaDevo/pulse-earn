/*
  # Update poll visibility and voting permissions
  
  1. Changes
     - Modify RLS policies for polls to allow public viewing
     - Keep voting restricted to authenticated users
     - Add public access policy for poll_categories
  
  2. Security
     - Enable public access to view polls and categories
     - Maintain authentication requirement for voting
     - Preserve admin management capabilities
*/

-- Update policies for polls table to allow public viewing
DROP POLICY IF EXISTS "Anyone can view active polls" ON polls;
CREATE POLICY "Anyone can view active polls" 
  ON polls
  FOR SELECT
  TO public
  USING (
    is_active = true AND 
    (start_date IS NULL OR start_date <= now()) AND
    (active_until IS NULL OR active_until > now())
  );

-- Keep the existing policy for authenticated users to create polls
-- No changes needed for the "Users can create polls" policy

-- Keep the existing policy for poll creators to update their polls
-- No changes needed for the "Poll creators can update their polls" policy

-- Keep the existing policy for admins to manage all polls
-- No changes needed for the "Admins can manage all polls" policy

-- Update policies for poll_categories to allow public viewing
DROP POLICY IF EXISTS "Anyone can view active categories" ON poll_categories;
CREATE POLICY "Anyone can view active categories"
  ON poll_categories
  FOR SELECT
  TO public
  USING (is_active = true);

-- Keep the existing policy for admins to manage categories
-- No changes needed for the "Admins can manage all categories" policy

-- Update policies for poll_votes to maintain authenticated-only voting
-- No changes needed as poll_votes already requires authentication