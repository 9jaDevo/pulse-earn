/*
  # Ambassador Commission Settings

  1. New Tables
    - `ambassador_commission_tiers` - Stores the commission tier configuration
      - `id` (uuid, primary key)
      - `name` (text) - Tier name (e.g., "Bronze", "Silver")
      - `min_referrals` (integer) - Minimum referrals required for this tier
      - `global_rate` (numeric) - Default commission rate for this tier
      - `country_rates` (jsonb) - Country-specific commission rates
      - `is_active` (boolean) - Whether this tier is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Functions
    - `calculate_ambassador_commission` - Calculates the commission rate for an ambassador
    - `process_referral_commission` - Processes commission when a referral generates revenue
    
  3. Triggers
    - `update_ambassador_commission_rate` - Updates ambassador's commission rate when referral count changes
*/

-- Create ambassador_commission_tiers table
CREATE TABLE IF NOT EXISTS ambassador_commission_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_referrals integer NOT NULL,
  global_rate numeric(5,2) NOT NULL,
  country_rates jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add index for faster tier lookup
CREATE INDEX IF NOT EXISTS ambassador_commission_tiers_min_referrals_idx ON ambassador_commission_tiers(min_referrals);

-- Enable RLS
ALTER TABLE ambassador_commission_tiers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage commission tiers"
  ON ambassador_commission_tiers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view commission tiers"
  ON ambassador_commission_tiers
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create function to calculate ambassador commission rate
CREATE OR REPLACE FUNCTION calculate_ambassador_commission(
  p_ambassador_id uuid,
  p_country text DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referral_count integer;
  v_ambassador_country text;
  v_tier record;
  v_commission_rate numeric(5,2);
  v_country_rates jsonb;
BEGIN
  -- Get ambassador's referral count
  SELECT total_referrals, country INTO v_referral_count, v_ambassador_country
  FROM ambassadors
  WHERE user_id = p_ambassador_id;
  
  -- If ambassador not found, return 0
  IF v_referral_count IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Get the highest tier the ambassador qualifies for
  SELECT * INTO v_tier
  FROM ambassador_commission_tiers
  WHERE min_referrals <= v_referral_count
    AND is_active = true
  ORDER BY min_referrals DESC
  LIMIT 1;
  
  -- If no tier found, return default rate of 10%
  IF v_tier IS NULL THEN
    RETURN 10.0;
  END IF;
  
  -- Start with global rate
  v_commission_rate := v_tier.global_rate;
  
  -- Check for country-specific rate
  v_country_rates := v_tier.country_rates;
  
  -- Use provided country or ambassador's country
  IF p_country IS NOT NULL THEN
    IF v_country_rates ? p_country THEN
      v_commission_rate := (v_country_rates->p_country)::numeric;
    END IF;
  ELSIF v_ambassador_country IS NOT NULL THEN
    IF v_country_rates ? v_ambassador_country THEN
      v_commission_rate := (v_country_rates->v_ambassador_country)::numeric;
    END IF;
  END IF;
  
  RETURN v_commission_rate;
END;
$$;

-- Create function to process referral commission
CREATE OR REPLACE FUNCTION process_referral_commission(
  p_referrer_id uuid,
  p_referred_id uuid,
  p_amount numeric,
  p_country text DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_commission_rate numeric(5,2);
  v_commission_amount numeric(10,2);
BEGIN
  -- Calculate commission rate
  v_commission_rate := calculate_ambassador_commission(p_referrer_id, p_country);
  
  -- Calculate commission amount
  v_commission_amount := (p_amount * v_commission_rate / 100)::numeric(10,2);
  
  -- Update ambassador's earnings
  UPDATE ambassadors
  SET total_earnings = total_earnings + v_commission_amount,
      updated_at = now()
  WHERE user_id = p_referrer_id;
  
  -- Record commission in history
  INSERT INTO daily_reward_history (
    user_id,
    reward_type,
    points_earned,
    reward_data
  ) VALUES (
    p_referrer_id,
    'referral_bonus',
    0, -- No points, just money
    jsonb_build_object(
      'commission_amount', v_commission_amount,
      'commission_rate', v_commission_rate,
      'referred_user_id', p_referred_id,
      'revenue_amount', p_amount
    )
  );
  
  RETURN v_commission_amount;
END;
$$;

-- Create trigger function to update ambassador commission rate when referral count changes
CREATE OR REPLACE FUNCTION update_ambassador_commission_rate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_rate numeric(5,2);
BEGIN
  -- Only proceed if referral count changed
  IF OLD.total_referrals = NEW.total_referrals THEN
    RETURN NEW;
  END IF;
  
  -- Calculate new commission rate
  v_new_rate := calculate_ambassador_commission(NEW.user_id, NEW.country);
  
  -- Update commission rate if different
  IF NEW.commission_rate != v_new_rate THEN
    NEW.commission_rate := v_new_rate;
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on ambassadors table
DROP TRIGGER IF EXISTS update_ambassador_commission_rate_trigger ON ambassadors;
CREATE TRIGGER update_ambassador_commission_rate_trigger
BEFORE UPDATE ON ambassadors
FOR EACH ROW
WHEN (OLD.total_referrals IS DISTINCT FROM NEW.total_referrals)
EXECUTE FUNCTION update_ambassador_commission_rate();

-- Insert default commission tiers
INSERT INTO ambassador_commission_tiers (name, min_referrals, global_rate, country_rates)
VALUES
  ('Bronze', 0, 10.00, '{"US": 12.00, "CA": 11.00, "GB": 11.00}'),
  ('Silver', 25, 15.00, '{"US": 17.00, "CA": 16.00, "GB": 16.00}'),
  ('Gold', 100, 20.00, '{"US": 22.00, "CA": 21.00, "GB": 21.00}'),
  ('Platinum', 250, 25.00, '{"US": 27.00, "CA": 26.00, "GB": 26.00}')
ON CONFLICT DO NOTHING;

-- Add function to get ambassador tier
CREATE OR REPLACE FUNCTION get_ambassador_tier(
  p_ambassador_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referral_count integer;
  v_ambassador_country text;
  v_tier record;
  v_commission_rate numeric(5,2);
  v_result jsonb;
BEGIN
  -- Get ambassador's referral count
  SELECT total_referrals, country, commission_rate 
  INTO v_referral_count, v_ambassador_country, v_commission_rate
  FROM ambassadors
  WHERE user_id = p_ambassador_id;
  
  -- If ambassador not found, return empty result
  IF v_referral_count IS NULL THEN
    RETURN jsonb_build_object(
      'found', false,
      'message', 'Ambassador not found'
    );
  END IF;
  
  -- Get the highest tier the ambassador qualifies for
  SELECT * INTO v_tier
  FROM ambassador_commission_tiers
  WHERE min_referrals <= v_referral_count
    AND is_active = true
  ORDER BY min_referrals DESC
  LIMIT 1;
  
  -- If no tier found, return default info
  IF v_tier IS NULL THEN
    RETURN jsonb_build_object(
      'found', true,
      'tier_name', 'Default',
      'min_referrals', 0,
      'current_referrals', v_referral_count,
      'commission_rate', v_commission_rate,
      'country', v_ambassador_country
    );
  END IF;
  
  -- Get next tier if available
  DECLARE
    v_next_tier record;
  BEGIN
    SELECT * INTO v_next_tier
    FROM ambassador_commission_tiers
    WHERE min_referrals > v_referral_count
      AND is_active = true
    ORDER BY min_referrals ASC
    LIMIT 1;
    
    -- Build result with tier info
    v_result := jsonb_build_object(
      'found', true,
      'tier_name', v_tier.name,
      'tier_id', v_tier.id,
      'min_referrals', v_tier.min_referrals,
      'current_referrals', v_referral_count,
      'commission_rate', v_commission_rate,
      'country', v_ambassador_country
    );
    
    -- Add next tier info if available
    IF v_next_tier IS NOT NULL THEN
      v_result := v_result || jsonb_build_object(
        'next_tier_name', v_next_tier.name,
        'next_tier_min_referrals', v_next_tier.min_referrals,
        'referrals_to_next_tier', v_next_tier.min_referrals - v_referral_count
      );
    END IF;
    
    RETURN v_result;
  END;
END;
$$;