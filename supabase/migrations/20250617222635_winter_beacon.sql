/*
  # Community Roles Infrastructure

  1. New Tables
    - `moderator_actions`
      - `id` (uuid, primary key)
      - `moderator_id` (uuid, references profiles)
      - `action_type` (text, type of action taken)
      - `target_id` (uuid, ID of the target entity)
      - `target_table` (text, table name of the target)
      - `reason` (text, reason for the action)
      - `metadata` (jsonb, additional action data)
      - `created_at` (timestamp)
    
    - `ambassadors`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles, unique)
      - `country` (text, ambassador's assigned country)
      - `commission_rate` (decimal, commission percentage)
      - `is_active` (boolean, ambassador status)
      - `total_referrals` (integer, total users referred)
      - `total_earnings` (decimal, total commission earned)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `country_metrics`
      - `id` (uuid, primary key)
      - `country` (text, country code/name)
      - `metric_date` (date, date for the metrics)
      - `ad_revenue` (decimal, ad revenue for the day)
      - `user_count` (integer, total active users)
      - `new_users` (integer, new users registered)
      - `total_points_earned` (bigint, total points earned by users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - Unique constraint on (country, metric_date)

  2. Security
    - Enable RLS on all tables
    - Add policies for moderators and ambassadors
    - Add policies for admins to manage all data

  3. Indexes
    - Performance indexes for common queries
    - Unique constraints for data integrity
*/

-- Create moderator_actions table
CREATE TABLE IF NOT EXISTS moderator_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_id uuid NOT NULL,
  target_table text NOT NULL,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create ambassadors table
CREATE TABLE IF NOT EXISTS ambassadors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  country text NOT NULL,
  commission_rate decimal(5,2) DEFAULT 15.00,
  is_active boolean DEFAULT true,
  total_referrals integer DEFAULT 0,
  total_earnings decimal(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create country_metrics table
CREATE TABLE IF NOT EXISTS country_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  metric_date date NOT NULL,
  ad_revenue decimal(10,2) DEFAULT 0.00,
  user_count integer DEFAULT 0,
  new_users integer DEFAULT 0,
  total_points_earned bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(country, metric_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS moderator_actions_moderator_id_idx ON moderator_actions(moderator_id);
CREATE INDEX IF NOT EXISTS moderator_actions_target_idx ON moderator_actions(target_id, target_table);
CREATE INDEX IF NOT EXISTS moderator_actions_action_type_idx ON moderator_actions(action_type);
CREATE INDEX IF NOT EXISTS moderator_actions_created_at_idx ON moderator_actions(created_at DESC);

CREATE INDEX IF NOT EXISTS ambassadors_user_id_idx ON ambassadors(user_id);
CREATE INDEX IF NOT EXISTS ambassadors_country_idx ON ambassadors(country);
CREATE INDEX IF NOT EXISTS ambassadors_active_idx ON ambassadors(is_active);

CREATE INDEX IF NOT EXISTS country_metrics_country_idx ON country_metrics(country);
CREATE INDEX IF NOT EXISTS country_metrics_date_idx ON country_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS country_metrics_country_date_idx ON country_metrics(country, metric_date);

-- Enable RLS
ALTER TABLE moderator_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_metrics ENABLE ROW LEVEL SECURITY;

-- Moderator Actions Policies
CREATE POLICY "Moderators can view their own actions"
  ON moderator_actions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = moderator_id);

CREATE POLICY "Moderators can insert their own actions"
  ON moderator_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = moderator_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "Admins can manage all moderator actions"
  ON moderator_actions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- Ambassadors Policies
CREATE POLICY "Ambassadors can view their own data"
  ON ambassadors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Ambassadors can update their own data"
  ON ambassadors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all ambassadors"
  ON ambassadors
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- Country Metrics Policies
CREATE POLICY "Ambassadors can view their country metrics"
  ON country_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ambassadors 
      WHERE ambassadors.user_id = auth.uid() 
      AND ambassadors.country = country_metrics.country
      AND ambassadors.is_active = true
    )
  );

CREATE POLICY "Admins can manage all country metrics"
  ON country_metrics
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- Create triggers for updating updated_at
CREATE TRIGGER update_ambassadors_updated_at
  BEFORE UPDATE ON ambassadors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_country_metrics_updated_at
  BEFORE UPDATE ON country_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create ambassador record when user role is set to ambassador
CREATE OR REPLACE FUNCTION handle_ambassador_role_change()
RETURNS trigger AS $$
BEGIN
  -- If role changed to ambassador, create ambassador record
  IF NEW.role = 'ambassador' AND (OLD.role IS NULL OR OLD.role != 'ambassador') THEN
    INSERT INTO ambassadors (user_id, country, is_active)
    VALUES (NEW.id, COALESCE(NEW.country, 'Global'), true)
    ON CONFLICT (user_id) DO UPDATE SET
      is_active = true,
      country = COALESCE(NEW.country, 'Global'),
      updated_at = now();
  END IF;
  
  -- If role changed from ambassador, deactivate ambassador record
  IF OLD.role = 'ambassador' AND NEW.role != 'ambassador' THEN
    UPDATE ambassadors 
    SET is_active = false, updated_at = now()
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ambassador role changes
CREATE TRIGGER handle_ambassador_role_change_trigger
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_ambassador_role_change();

-- Insert sample country metrics for demonstration
INSERT INTO country_metrics (country, metric_date, ad_revenue, user_count, new_users, total_points_earned) VALUES
  ('United States', CURRENT_DATE, 1250.50, 1847, 23, 45680),
  ('United Kingdom', CURRENT_DATE, 890.25, 1234, 18, 32450),
  ('Canada', CURRENT_DATE, 675.75, 892, 15, 28930),
  ('Australia', CURRENT_DATE, 543.20, 678, 12, 21560),
  ('Germany', CURRENT_DATE, 789.40, 1156, 20, 38720),
  ('France', CURRENT_DATE, 654.30, 987, 16, 31240),
  ('Japan', CURRENT_DATE, 432.80, 756, 11, 24680),
  ('Brazil', CURRENT_DATE, 345.60, 623, 14, 19870),
  ('India', CURRENT_DATE, 567.90, 1345, 28, 42350),
  ('Mexico', CURRENT_DATE, 298.45, 534, 9, 17230)
ON CONFLICT (country, metric_date) DO NOTHING;