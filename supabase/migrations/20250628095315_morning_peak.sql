/*
  # Payout System Implementation

  1. New Tables
    - `payout_methods` - Stores available payout methods (PayPal, bank transfer, etc.)
    - `payout_requests` - Stores user payout requests and their status

  2. Profile Updates
    - Add payout method preferences to profiles table
    - Add total payouts tracking to ambassadors table

  3. Functions
    - Create function to calculate payable balance
    - Create triggers for updating timestamps
*/

-- Add payout method preferences to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payout_method TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paypal_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '{}'::jsonb;

-- Add total payouts tracking to ambassadors table
ALTER TABLE ambassadors ADD COLUMN IF NOT EXISTS total_payouts NUMERIC(10,2) DEFAULT 0.00;

-- Create payout_methods table
CREATE TABLE IF NOT EXISTS payout_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_automatic BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payout_requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payout_method TEXT NOT NULL,
  payout_details JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS payout_requests_user_id_idx ON payout_requests(user_id);
CREATE INDEX IF NOT EXISTS payout_requests_status_idx ON payout_requests(status);
CREATE INDEX IF NOT EXISTS payout_requests_requested_at_idx ON payout_requests(requested_at);
CREATE INDEX IF NOT EXISTS payout_methods_active_idx ON payout_methods(is_active);

-- Enable RLS on new tables
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payout_requests
CREATE POLICY "Users can view their own payout requests"
  ON payout_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own payout requests"
  ON payout_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all payout requests"
  ON payout_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create RLS policies for payout_methods
CREATE POLICY "Anyone can view active payout methods"
  ON payout_methods
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage payout methods"
  ON payout_methods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_payout_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payout_requests_updated_at
BEFORE UPDATE ON payout_requests
FOR EACH ROW
EXECUTE FUNCTION update_payout_requests_updated_at();

CREATE OR REPLACE FUNCTION update_payout_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payout_methods_updated_at
BEFORE UPDATE ON payout_methods
FOR EACH ROW
EXECUTE FUNCTION update_payout_methods_updated_at();

-- Create function to calculate payable balance
CREATE OR REPLACE FUNCTION get_ambassador_payable_balance(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_earnings NUMERIC(10,2);
  v_total_payouts NUMERIC(10,2);
  v_pending_payouts NUMERIC(10,2);
  v_payable_balance NUMERIC(10,2);
BEGIN
  -- Get total earnings
  SELECT total_earnings, total_payouts INTO v_total_earnings, v_total_payouts
  FROM ambassadors
  WHERE user_id = p_user_id;
  
  -- If ambassador not found, return 0
  IF v_total_earnings IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Get pending payouts
  SELECT COALESCE(SUM(amount), 0) INTO v_pending_payouts
  FROM payout_requests
  WHERE user_id = p_user_id
  AND status = 'pending';
  
  -- Calculate payable balance
  v_payable_balance := v_total_earnings - v_total_payouts - v_pending_payouts;
  
  -- Ensure balance is not negative
  IF v_payable_balance < 0 THEN
    v_payable_balance := 0;
  END IF;
  
  RETURN v_payable_balance;
END;
$$;

-- Insert default payout methods
INSERT INTO payout_methods (name, description, is_automatic, is_active, config)
VALUES 
  ('PayPal', 'Receive payments directly to your PayPal account', false, true, '{"requires_email": true, "min_payout": 10.00, "fee_percentage": 2.9, "fee_fixed": 0.30}'),
  ('Bank Transfer', 'Direct bank transfer to your account', false, true, '{"requires_bank_details": true, "min_payout": 50.00, "processing_days": 3, "fee_fixed": 1.00}'),
  ('Manual', 'Manual processing by admin', false, true, '{"requires_admin_approval": true, "min_payout": 100.00}')
ON CONFLICT DO NOTHING;