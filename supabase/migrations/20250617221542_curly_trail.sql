/*
  # Create Polls System

  1. New Tables
    - `polls`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text)
      - `options` (jsonb array of poll options with vote counts)
      - `type` (enum: 'global', 'country')
      - `country` (text, nullable for global polls)
      - `slug` (text, unique, SEO-friendly URL)
      - `created_by` (uuid, references profiles)
      - `active_until` (timestamp, poll expiration)
      - `is_active` (boolean, default true)
      - `total_votes` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `poll_votes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `poll_id` (uuid, references polls)
      - `vote_option` (integer, selected option index)
      - `created_at` (timestamp)
      - Unique constraint on (user_id, poll_id)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read polls
    - Add policies for users to vote once per poll
    - Add policies for poll creators to manage their polls

  3. Indexes
    - Performance indexes for common queries
    - Unique constraints for data integrity
*/

-- Create poll type enum
CREATE TYPE poll_type AS ENUM ('global', 'country');

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  type poll_type NOT NULL DEFAULT 'global',
  country text,
  slug text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  active_until timestamptz,
  is_active boolean DEFAULT true,
  total_votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create poll_votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  vote_option integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, poll_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS polls_type_idx ON polls(type);
CREATE INDEX IF NOT EXISTS polls_country_idx ON polls(country);
CREATE INDEX IF NOT EXISTS polls_active_idx ON polls(is_active, active_until);
CREATE INDEX IF NOT EXISTS polls_created_by_idx ON polls(created_by);
CREATE INDEX IF NOT EXISTS polls_slug_idx ON polls(slug);
CREATE INDEX IF NOT EXISTS polls_total_votes_idx ON polls(total_votes DESC);
CREATE INDEX IF NOT EXISTS poll_votes_user_id_idx ON poll_votes(user_id);
CREATE INDEX IF NOT EXISTS poll_votes_poll_id_idx ON poll_votes(poll_id);

-- Add constraints
ALTER TABLE polls ADD CONSTRAINT polls_options_check 
  CHECK (jsonb_array_length(options) >= 2);

ALTER TABLE poll_votes ADD CONSTRAINT poll_votes_option_check 
  CHECK (vote_option >= 0);

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Anyone can view active polls"
  ON polls
  FOR SELECT
  TO authenticated
  USING (is_active = true AND (active_until IS NULL OR active_until > now()));

CREATE POLICY "Users can create polls"
  ON polls
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Poll creators can update their polls"
  ON polls
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all polls"
  ON polls
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- Poll votes policies
CREATE POLICY "Users can view all poll votes"
  ON poll_votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own votes"
  ON poll_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own votes"
  ON poll_votes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_polls_updated_at
  BEFORE UPDATE ON polls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_poll_slug(poll_title text)
RETURNS text AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(poll_title, '[^a-zA-Z0-9\s]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update poll vote counts
CREATE OR REPLACE FUNCTION update_poll_vote_counts()
RETURNS trigger AS $$
BEGIN
  -- Update the poll's options array and total_votes
  UPDATE polls 
  SET 
    total_votes = (
      SELECT COUNT(*) 
      FROM poll_votes 
      WHERE poll_id = COALESCE(NEW.poll_id, OLD.poll_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.poll_id, OLD.poll_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update vote counts
CREATE TRIGGER update_poll_vote_counts_trigger
  AFTER INSERT OR DELETE ON poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_vote_counts();