/*
  # Daily Rewards System

  1. New Tables
    - `trivia_questions`
      - `id` (uuid, primary key)
      - `question` (text, the question text)
      - `options` (text array, multiple choice options)
      - `correct_answer` (integer, index of correct option)
      - `category` (text, question category)
      - `difficulty` (enum, easy/medium/hard)
      - `country` (text, nullable, for country-specific questions)
      - `is_active` (boolean, whether question is available)
      - `created_at` (timestamp)

    - `user_daily_rewards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `last_spin_date` (date, last spin & win date)
      - `last_trivia_date` (date, last trivia challenge date)
      - `last_watch_date` (date, last watch & win date)
      - `trivia_streak` (integer, consecutive days of trivia completion)
      - `spin_streak` (integer, consecutive days of spinning)
      - `total_spins` (integer, lifetime spins)
      - `total_trivia_completed` (integer, lifetime trivia games)
      - `total_ads_watched` (integer, lifetime ads watched)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `daily_reward_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `reward_type` (enum, spin/trivia/watch)
      - `points_earned` (integer)
      - `reward_data` (jsonb, additional reward info)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add admin policies for management

  3. Indexes
    - Performance indexes for common queries
    - Date-based indexes for daily reward checks
*/

-- Create enums
CREATE TYPE trivia_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE daily_reward_type AS ENUM ('spin', 'trivia', 'watch');

-- Create trivia_questions table
CREATE TABLE IF NOT EXISTS trivia_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options text[] NOT NULL CHECK (array_length(options, 1) >= 2),
  correct_answer integer NOT NULL CHECK (correct_answer >= 0 AND correct_answer < array_length(options, 1)),
  category text NOT NULL,
  difficulty trivia_difficulty DEFAULT 'medium' NOT NULL,
  country text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create user_daily_rewards table
CREATE TABLE IF NOT EXISTS user_daily_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_spin_date date,
  last_trivia_date date,
  last_watch_date date,
  trivia_streak integer DEFAULT 0 NOT NULL,
  spin_streak integer DEFAULT 0 NOT NULL,
  total_spins integer DEFAULT 0 NOT NULL,
  total_trivia_completed integer DEFAULT 0 NOT NULL,
  total_ads_watched integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create daily_reward_history table
CREATE TABLE IF NOT EXISTS daily_reward_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reward_type daily_reward_type NOT NULL,
  points_earned integer NOT NULL,
  reward_data jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reward_history ENABLE ROW LEVEL SECURITY;

-- Policies for trivia_questions
CREATE POLICY "Anyone can view active trivia questions"
  ON trivia_questions
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage trivia questions"
  ON trivia_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for user_daily_rewards
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

CREATE POLICY "Users can insert their own daily rewards"
  ON user_daily_rewards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all daily rewards"
  ON user_daily_rewards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for daily_reward_history
CREATE POLICY "Users can view their own reward history"
  ON daily_reward_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reward history"
  ON daily_reward_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all reward history"
  ON daily_reward_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create trigger for updating updated_at on user_daily_rewards
CREATE TRIGGER update_user_daily_rewards_updated_at
  BEFORE UPDATE ON user_daily_rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS trivia_questions_category_idx ON trivia_questions(category);
CREATE INDEX IF NOT EXISTS trivia_questions_difficulty_idx ON trivia_questions(difficulty);
CREATE INDEX IF NOT EXISTS trivia_questions_country_idx ON trivia_questions(country);
CREATE INDEX IF NOT EXISTS trivia_questions_active_idx ON trivia_questions(is_active);

CREATE INDEX IF NOT EXISTS user_daily_rewards_user_id_idx ON user_daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS user_daily_rewards_dates_idx ON user_daily_rewards(last_spin_date, last_trivia_date, last_watch_date);

CREATE INDEX IF NOT EXISTS daily_reward_history_user_id_idx ON daily_reward_history(user_id);
CREATE INDEX IF NOT EXISTS daily_reward_history_type_idx ON daily_reward_history(reward_type);
CREATE INDEX IF NOT EXISTS daily_reward_history_date_idx ON daily_reward_history(created_at DESC);

-- Insert sample trivia questions
INSERT INTO trivia_questions (question, options, correct_answer, category, difficulty, country) VALUES
  ('What is the capital of France?', ARRAY['London', 'Berlin', 'Paris', 'Madrid'], 2, 'Geography', 'easy', NULL),
  ('Which planet is known as the Red Planet?', ARRAY['Venus', 'Mars', 'Jupiter', 'Saturn'], 1, 'Science', 'easy', NULL),
  ('What year did World War II end?', ARRAY['1944', '1945', '1946', '1947'], 1, 'History', 'medium', NULL),
  ('What is the largest mammal in the world?', ARRAY['African Elephant', 'Blue Whale', 'Giraffe', 'Polar Bear'], 1, 'Science', 'easy', NULL),
  ('Which programming language was created by Guido van Rossum?', ARRAY['Java', 'Python', 'C++', 'JavaScript'], 1, 'Technology', 'medium', NULL),
  ('What is the chemical symbol for gold?', ARRAY['Go', 'Gd', 'Au', 'Ag'], 2, 'Science', 'medium', NULL),
  ('Which country has the most time zones?', ARRAY['Russia', 'USA', 'China', 'Canada'], 0, 'Geography', 'hard', NULL),
  ('What is the smallest country in the world?', ARRAY['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], 1, 'Geography', 'medium', NULL),
  ('Who painted the Mona Lisa?', ARRAY['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Michelangelo'], 2, 'Art', 'easy', NULL),
  ('What is the speed of light in vacuum?', ARRAY['299,792,458 m/s', '300,000,000 m/s', '299,000,000 m/s', '298,792,458 m/s'], 0, 'Science', 'hard', NULL);