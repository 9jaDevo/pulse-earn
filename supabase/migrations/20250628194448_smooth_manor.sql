/*
# Promoted Polls and Transactions Schema

1. New Tables
   - `sponsors` - Stores information about organizations sponsoring polls
   - `promoted_polls` - Links polls to sponsors with promotion details
   - `transactions` - Records payment transactions for promoted content
   - `payment_methods` - Stores available payment methods

2. Security
   - Enable RLS on all tables
   - Add policies for admins to manage all records
   - Add policies for users to view their own records
   - Add policies for sponsors to view their own promotions

3. Changes
   - Add triggers to update promoted poll status when target votes reached
   - Add functions to handle payment processing
*/

-- Create sponsors table
CREATE TABLE IF NOT EXISTS sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_email text NOT NULL,
  website_url text,
  description text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for sponsors table
CREATE INDEX IF NOT EXISTS sponsors_user_id_idx ON sponsors(user_id);
CREATE INDEX IF NOT EXISTS sponsors_is_active_idx ON sponsors(is_active);
CREATE INDEX IF NOT EXISTS sponsors_is_verified_idx ON sponsors(is_verified);

-- Create promoted_polls table
CREATE TABLE IF NOT EXISTS promoted_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  sponsor_id uuid NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  pricing_model text NOT NULL CHECK (pricing_model IN ('CPV')), -- Cost Per Vote
  budget_amount numeric(10,2) NOT NULL CHECK (budget_amount > 0),
  cost_per_vote numeric(10,2) NOT NULL CHECK (cost_per_vote > 0),
  target_votes integer NOT NULL CHECK (target_votes > 0),
  current_votes integer DEFAULT 0,
  status text NOT NULL CHECK (status IN ('pending_approval', 'active', 'paused', 'completed', 'rejected')) DEFAULT 'pending_approval',
  payment_status text NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  admin_notes text,
  CONSTRAINT promoted_polls_poll_id_key UNIQUE (poll_id)
);

-- Create indexes for promoted_polls table
CREATE INDEX IF NOT EXISTS promoted_polls_poll_id_idx ON promoted_polls(poll_id);
CREATE INDEX IF NOT EXISTS promoted_polls_sponsor_id_idx ON promoted_polls(sponsor_id);
CREATE INDEX IF NOT EXISTS promoted_polls_status_idx ON promoted_polls(status);
CREATE INDEX IF NOT EXISTS promoted_polls_payment_status_idx ON promoted_polls(payment_status);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('wallet', 'stripe', 'paypal', 'paystack')),
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  promoted_poll_id uuid REFERENCES promoted_polls(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_method text NOT NULL CHECK (payment_method IN ('wallet', 'stripe', 'paypal', 'paystack')),
  payment_method_id uuid REFERENCES payment_methods(id),
  gateway_transaction_id text,
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for transactions table
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_promoted_poll_id_idx ON transactions(promoted_poll_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions(created_at);

-- Create function to update promoted poll status when target votes reached
CREATE OR REPLACE FUNCTION update_promoted_poll_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If current_votes >= target_votes, mark as completed
  IF NEW.current_votes >= NEW.target_votes AND NEW.status = 'active' THEN
    NEW.status := 'completed';
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update promoted poll status
CREATE TRIGGER update_promoted_poll_status_trigger
BEFORE UPDATE ON promoted_polls
FOR EACH ROW
EXECUTE FUNCTION update_promoted_poll_status();

-- Create function to increment promoted poll votes
CREATE OR REPLACE FUNCTION increment_promoted_poll_votes()
RETURNS TRIGGER AS $$
DECLARE
  promoted_poll_record RECORD;
BEGIN
  -- Check if the poll is being promoted
  SELECT * INTO promoted_poll_record
  FROM promoted_polls
  WHERE poll_id = NEW.poll_id AND status = 'active';
  
  -- If poll is being promoted, increment vote count
  IF FOUND THEN
    UPDATE promoted_polls
    SET 
      current_votes = current_votes + 1,
      updated_at = now()
    WHERE id = promoted_poll_record.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to increment promoted poll votes when a vote is cast
CREATE TRIGGER increment_promoted_poll_votes_trigger
AFTER INSERT ON poll_votes
FOR EACH ROW
EXECUTE FUNCTION increment_promoted_poll_votes();

-- Enable Row Level Security on all tables
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoted_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sponsors table
CREATE POLICY "Admins can manage all sponsors"
ON sponsors
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
);

CREATE POLICY "Users can view their own sponsors"
ON sponsors
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sponsors"
ON sponsors
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sponsors"
ON sponsors
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create RLS policies for promoted_polls table
CREATE POLICY "Admins can manage all promoted polls"
ON promoted_polls
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
);

CREATE POLICY "Users can view their own promoted polls"
ON promoted_polls
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sponsors
    WHERE sponsors.id = promoted_polls.sponsor_id AND sponsors.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create promoted polls for their sponsors"
ON promoted_polls
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sponsors
    WHERE sponsors.id = promoted_polls.sponsor_id AND sponsors.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view active promoted polls"
ON promoted_polls
FOR SELECT
TO authenticated
USING (status = 'active');

-- Create RLS policies for payment_methods table
CREATE POLICY "Admins can manage payment methods"
ON payment_methods
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
);

CREATE POLICY "Anyone can view active payment methods"
ON payment_methods
FOR SELECT
TO authenticated
USING (is_active = true);

-- Create RLS policies for transactions table
CREATE POLICY "Admins can manage all transactions"
ON transactions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
);

CREATE POLICY "Users can view their own transactions"
ON transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create triggers for updated_at columns
CREATE TRIGGER update_sponsors_updated_at
BEFORE UPDATE ON sponsors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promoted_polls_updated_at
BEFORE UPDATE ON promoted_polls
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON payment_methods
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default payment methods
INSERT INTO payment_methods (name, description, type, is_active, config)
VALUES 
  ('Wallet Balance', 'Pay using your platform points balance', 'wallet', true, '{"conversion_rate": 100}'),
  ('Credit Card', 'Pay with Stripe', 'stripe', true, '{}'),
  ('PayPal', 'Pay with PayPal', 'paypal', true, '{}'),
  ('Paystack', 'Pay with Paystack', 'paystack', true, '{}')
ON CONFLICT DO NOTHING;

-- Add settings for promoted polls
INSERT INTO app_settings (category, settings)
VALUES (
  'promoted_polls',
  jsonb_build_object(
    'is_enabled', true,
    'default_cost_per_vote', 0.05,
    'minimum_budget', 10.00,
    'maximum_budget', 1000.00,
    'approval_required', true,
    'points_to_usd_conversion', 100, -- 100 points = $1
    'available_payment_methods', ARRAY['wallet', 'stripe', 'paypal', 'paystack']
  )
)
ON CONFLICT (category) 
DO UPDATE SET 
  settings = app_settings.settings || excluded.settings,
  updated_at = now();