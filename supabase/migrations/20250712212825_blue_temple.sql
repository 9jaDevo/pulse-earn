/*
  # Create Trivia Contests Table

  1. New Tables
    - `trivia_contests`
      - `id` (uuid, primary key)
      - `title` (text, contest name)
      - `description` (text, contest description)
      - `entry_fee` (integer, points required to enter)
      - `start_time` (timestamptz, when contest begins)
      - `end_time` (timestamptz, when contest ends)
      - `status` (enum, contest status)
      - `prize_pool_amount` (numeric, total prize money)
      - `prize_pool_currency` (text, currency type)
      - `num_winners` (integer, number of winners)
      - `payout_structure` (jsonb, prize distribution)
      - `trivia_game_id` (uuid, foreign key to trivia_games)
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `trivia_contests` table
    - Add policies for authenticated users to read contests
    - Add policies for admins to manage contests
*/

-- Create contest status enum
CREATE TYPE contest_status AS ENUM (
  'upcoming',
  'enrolling', 
  'active',
  'ended',
  'disbursed',
  'cancelled'
);

-- Create trivia contests table
CREATE TABLE IF NOT EXISTS trivia_contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  entry_fee integer NOT NULL DEFAULT 0,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status contest_status DEFAULT 'upcoming',
  prize_pool_amount numeric(10,2) DEFAULT 0,
  prize_pool_currency text DEFAULT 'USD',
  num_winners integer DEFAULT 1,
  payout_structure jsonb DEFAULT '[]'::jsonb,
  trivia_game_id uuid REFERENCES trivia_games(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_times CHECK (end_time > start_time),
  CONSTRAINT valid_entry_fee CHECK (entry_fee >= 0),
  CONSTRAINT valid_num_winners CHECK (num_winners > 0),
  CONSTRAINT valid_prize_pool CHECK (prize_pool_amount >= 0)
);

-- Enable RLS
ALTER TABLE trivia_contests ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all contests
CREATE POLICY "Users can read all contests"
  ON trivia_contests
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admins to manage contests
CREATE POLICY "Admins can manage contests"
  ON trivia_contests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trivia_contests_updated_at
  BEFORE UPDATE ON trivia_contests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();