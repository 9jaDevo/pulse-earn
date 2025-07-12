/*
  # Create Contest Enrollments Table

  1. New Tables
    - `contest_enrollments`
      - `id` (uuid, primary key)
      - `contest_id` (uuid, foreign key to trivia_contests)
      - `user_id` (uuid, foreign key to profiles)
      - `enrollment_time` (timestamptz)
      - `payment_status` (enum, payment status)
      - `transaction_id` (uuid, foreign key to transactions, nullable)
      - `has_played` (boolean, if user completed contest)
      - `score` (integer, user's score)
      - `rank` (integer, user's final rank)
      - `prize_awarded` (numeric, amount awarded)

  2. Security
    - Enable RLS on `contest_enrollments` table
    - Add policies for users to read their own enrollments
    - Add policies for admins to read all enrollments
*/

-- Create enrollment payment status enum
CREATE TYPE enrollment_payment_status AS ENUM (
  'pending',
  'paid',
  'failed'
);

-- Create contest enrollments table
CREATE TABLE IF NOT EXISTS contest_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES trivia_contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_time timestamptz DEFAULT now(),
  payment_status enrollment_payment_status DEFAULT 'pending',
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  has_played boolean DEFAULT false,
  score integer,
  rank integer,
  prize_awarded numeric(10,2) DEFAULT 0,
  
  UNIQUE(contest_id, user_id),
  CONSTRAINT valid_score CHECK (score >= 0),
  CONSTRAINT valid_rank CHECK (rank > 0),
  CONSTRAINT valid_prize CHECK (prize_awarded >= 0)
);

-- Enable RLS
ALTER TABLE contest_enrollments ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own enrollments
CREATE POLICY "Users can read own enrollments"
  ON contest_enrollments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy for users to insert their own enrollments
CREATE POLICY "Users can create own enrollments"
  ON contest_enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy for users to update their own enrollments (for score submission)
CREATE POLICY "Users can update own enrollments"
  ON contest_enrollments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy for admins to read all enrollments
CREATE POLICY "Admins can read all enrollments"
  ON contest_enrollments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy for admins to update all enrollments (for prize disbursement)
CREATE POLICY "Admins can update all enrollments"
  ON contest_enrollments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );