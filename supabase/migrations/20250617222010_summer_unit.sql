/*
  # Create Badges System

  1. New Tables
    - `badges`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `description` (text, not null)
      - `icon_url` (text, nullable)
      - `criteria` (jsonb, stores rules for awarding)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on badges table
    - Add policies for authenticated users to read badges
    - Add policies for admins to manage badges

  3. Indexes
    - Performance indexes for common queries
    - Unique constraints for data integrity

  4. Sample Data
    - Insert initial badges for common achievements
*/

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon_url text,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS badges_name_idx ON badges(name);
CREATE INDEX IF NOT EXISTS badges_active_idx ON badges(is_active);
CREATE INDEX IF NOT EXISTS badges_created_at_idx ON badges(created_at DESC);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Badges policies
CREATE POLICY "Anyone can view active badges"
  ON badges
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage all badges"
  ON badges
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- Create trigger for updating updated_at
CREATE TRIGGER update_badges_updated_at
  BEFORE UPDATE ON badges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial badges
INSERT INTO badges (name, description, criteria) VALUES
  ('First Steps', 'Complete your first poll vote', '{"type": "poll_votes", "count": 1}'),
  ('Poll Enthusiast', 'Vote in 10 different polls', '{"type": "poll_votes", "count": 10}'),
  ('Poll Master', 'Vote in 50 different polls', '{"type": "poll_votes", "count": 50}'),
  ('Poll Creator', 'Create your first poll', '{"type": "polls_created", "count": 1}'),
  ('Community Builder', 'Create 5 polls', '{"type": "polls_created", "count": 5}'),
  ('Trivia Novice', 'Complete your first trivia game', '{"type": "trivia_completed", "count": 1}'),
  ('Trivia Expert', 'Complete 25 trivia games', '{"type": "trivia_completed", "count": 25}'),
  ('Trivia Master', 'Complete 100 trivia games', '{"type": "trivia_completed", "count": 100}'),
  ('Perfect Score', 'Get 100% on a hard trivia game', '{"type": "trivia_perfect", "difficulty": "hard"}'),
  ('Streak Keeper', 'Maintain a 7-day login streak', '{"type": "login_streak", "count": 7}'),
  ('Streak Master', 'Maintain a 30-day login streak', '{"type": "login_streak", "count": 30}'),
  ('Streak Legend', 'Maintain a 100-day login streak', '{"type": "login_streak", "count": 100}'),
  ('Point Collector', 'Earn 1,000 total points', '{"type": "total_points", "count": 1000}'),
  ('Point Hoarder', 'Earn 10,000 total points', '{"type": "total_points", "count": 10000}'),
  ('Point Millionaire', 'Earn 100,000 total points', '{"type": "total_points", "count": 100000}'),
  ('Spin Winner', 'Win points from the daily spin 10 times', '{"type": "spin_wins", "count": 10}'),
  ('Lucky Spinner', 'Hit the jackpot on daily spin', '{"type": "spin_jackpot", "count": 1}'),
  ('Ad Watcher', 'Watch 50 ads for rewards', '{"type": "ads_watched", "count": 50}'),
  ('Early Adopter', 'Join during the first month', '{"type": "early_adopter", "before": "2025-07-01"}'),
  ('Ambassador', 'Refer 10 new users', '{"type": "referrals", "count": 10}')
ON CONFLICT (name) DO NOTHING;