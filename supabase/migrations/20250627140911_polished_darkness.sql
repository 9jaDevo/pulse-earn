/*
  # Create App Settings Table

  1. New Table
    - `app_settings`
      - `id` (uuid, primary key)
      - `category` (text, unique, e.g., 'general', 'security', 'notifications')
      - `settings` (jsonb, stores configuration values)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on the table
    - Add policy for admins to manage settings
    - Add policy for authenticated users to read settings

  3. Indexes
    - Index on category for faster lookups
*/

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text UNIQUE NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON app_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS app_settings_category_idx ON app_settings(category);

-- Create trigger for updating updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO app_settings (category, settings) VALUES
  ('general', '{
    "platformName": "PulseEarn",
    "platformDescription": "Community-powered platform for polls, trivia, and rewards",
    "defaultLanguage": "en"
  }'),
  ('points', '{
    "pollVotePoints": 50,
    "triviaEasyPoints": 10,
    "triviaMediumPoints": 20,
    "triviaHardPoints": 30,
    "adWatchPoints": 15,
    "referralBonusPoints": 100
  }'),
  ('security', '{
    "requireEmailVerification": false,
    "sessionTimeoutMinutes": 60,
    "autoModerateContent": true,
    "requirePollApproval": false,
    "maxReportsBeforeAutoHide": 5
  }'),
  ('notifications', '{
    "newUserRegistrations": true,
    "contentReports": true,
    "systemAlerts": true
  }'),
  ('integrations', '{
    "adsenseEnabled": true,
    "adsenseClientId": "ca-pub-xxxxxxxxxxxxxxxxx",
    "adsenseHeaderSlot": "1234567890",
    "adsenseFooterSlot": "0987654321",
    "adsenseSidebarSlot": "1122334455",
    "adsenseContentSlot": "5544332211",
    "adsenseMobileSlot": "9988776655"
  }')
ON CONFLICT (category) DO NOTHING;