/*
  # Multi-Currency and Payment Gateway Management

  1. New Tables
    - `currency_exchange_rates` - Stores exchange rates between different currencies
    - `country_currency_settings` - Defines which currencies are enabled for specific countries

  2. Schema Updates
    - Add `currency` column to `profiles`, `transactions`, `payout_requests`, and `reward_store_items`
    - Add `enabled_currencies` and `default_currency` to country settings
    - Update app_settings to support country-specific payment gateway configuration

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies for admin access
*/

-- Add currency column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add currency column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS original_amount NUMERIC(10,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS original_currency TEXT;

-- Add currency column to payout_requests table
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add currency column to reward_store_items table
ALTER TABLE reward_store_items ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Create currency_exchange_rates table
CREATE TABLE IF NOT EXISTS currency_exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(10, 6) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_currency, to_currency)
);

-- Create country_currency_settings table
CREATE TABLE IF NOT EXISTS country_currency_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL UNIQUE,
  enabled_currencies TEXT[] NOT NULL DEFAULT ARRAY['USD'],
  default_currency TEXT NOT NULL DEFAULT 'USD',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE currency_exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_currency_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for currency_exchange_rates
CREATE POLICY "Admins can manage exchange rates" 
  ON currency_exchange_rates
  FOR ALL 
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Anyone can view exchange rates" 
  ON currency_exchange_rates
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create policies for country_currency_settings
CREATE POLICY "Admins can manage country currency settings" 
  ON country_currency_settings
  FOR ALL 
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Anyone can view country currency settings" 
  ON country_currency_settings
  FOR SELECT 
  TO authenticated
  USING (true);

-- Insert default exchange rates
INSERT INTO currency_exchange_rates (from_currency, to_currency, rate)
VALUES 
  ('USD', 'USD', 1.0),
  ('USD', 'GBP', 0.78),
  ('USD', 'NGN', 1500.0),
  ('GBP', 'USD', 1.28),
  ('GBP', 'GBP', 1.0),
  ('GBP', 'NGN', 1920.0),
  ('NGN', 'USD', 0.00067),
  ('NGN', 'GBP', 0.00052),
  ('NGN', 'NGN', 1.0)
ON CONFLICT (from_currency, to_currency) DO UPDATE
SET rate = EXCLUDED.rate, updated_at = now();

-- Insert default country currency settings for popular countries
INSERT INTO country_currency_settings (country_code, enabled_currencies, default_currency)
VALUES 
  ('US', ARRAY['USD'], 'USD'),
  ('GB', ARRAY['GBP', 'USD'], 'GBP'),
  ('NG', ARRAY['NGN', 'USD'], 'NGN')
ON CONFLICT (country_code) DO UPDATE
SET enabled_currencies = EXCLUDED.enabled_currencies, 
    default_currency = EXCLUDED.default_currency, 
    updated_at = now();

-- Update app_settings table with payment gateway settings
DO $$
DECLARE
  settings_id UUID;
BEGIN
  -- Check if payment_gateways settings exist
  SELECT id INTO settings_id FROM app_settings WHERE category = 'payment_gateways';
  
  IF settings_id IS NULL THEN
    -- Insert new settings
    INSERT INTO app_settings (category, settings)
    VALUES ('payment_gateways', jsonb_build_object(
      'default_gateways', ARRAY['stripe', 'wallet'],
      'country_gateways', jsonb_build_object(
        'US', ARRAY['stripe', 'wallet'],
        'GB', ARRAY['stripe', 'wallet'],
        'NG', ARRAY['paystack', 'wallet']
      )
    ));
  ELSE
    -- Update existing settings
    UPDATE app_settings
    SET settings = jsonb_build_object(
      'default_gateways', ARRAY['stripe', 'wallet'],
      'country_gateways', jsonb_build_object(
        'US', ARRAY['stripe', 'wallet'],
        'GB', ARRAY['stripe', 'wallet'],
        'NG', ARRAY['paystack', 'wallet']
      )
    )
    WHERE id = settings_id;
  END IF;
END $$;

-- Create function to get user's currency based on country
CREATE OR REPLACE FUNCTION get_user_currency(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_country TEXT;
  v_currency TEXT;
  v_default_currency TEXT := 'USD';
BEGIN
  -- Get user's country
  SELECT country INTO v_country
  FROM profiles
  WHERE id = p_user_id;
  
  -- If user has no country, return default currency
  IF v_country IS NULL THEN
    RETURN v_default_currency;
  END IF;
  
  -- Get default currency for user's country
  SELECT default_currency INTO v_currency
  FROM country_currency_settings
  WHERE country_code = v_country;
  
  -- If no currency setting for country, return default
  IF v_currency IS NULL THEN
    RETURN v_default_currency;
  END IF;
  
  RETURN v_currency;
END;
$$;

-- Create function to convert amount between currencies
CREATE OR REPLACE FUNCTION convert_currency(
  p_amount NUMERIC,
  p_from_currency TEXT,
  p_to_currency TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rate NUMERIC;
BEGIN
  -- If currencies are the same, no conversion needed
  IF p_from_currency = p_to_currency THEN
    RETURN p_amount;
  END IF;
  
  -- Get exchange rate
  SELECT rate INTO v_rate
  FROM currency_exchange_rates
  WHERE from_currency = p_from_currency AND to_currency = p_to_currency;
  
  -- If rate not found, try to calculate via USD
  IF v_rate IS NULL THEN
    DECLARE
      v_to_usd NUMERIC;
      v_from_usd NUMERIC;
    BEGIN
      -- Get rate to convert from currency to USD
      SELECT rate INTO v_to_usd
      FROM currency_exchange_rates
      WHERE from_currency = p_from_currency AND to_currency = 'USD';
      
      -- Get rate to convert from USD to target currency
      SELECT rate INTO v_from_usd
      FROM currency_exchange_rates
      WHERE from_currency = 'USD' AND to_currency = p_to_currency;
      
      -- If both rates exist, calculate the conversion
      IF v_to_usd IS NOT NULL AND v_from_usd IS NOT NULL THEN
        v_rate := v_to_usd * v_from_usd;
      ELSE
        -- Default to 1:1 if no conversion path found
        v_rate := 1;
      END IF;
    END;
  END IF;
  
  -- Return converted amount
  RETURN p_amount * v_rate;
END;
$$;

-- Create function to get available payment methods for a country
CREATE OR REPLACE FUNCTION get_country_payment_methods(p_country_code TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment_methods TEXT[];
  v_settings JSONB;
BEGIN
  -- Get payment gateway settings
  SELECT settings INTO v_settings
  FROM app_settings
  WHERE category = 'payment_gateways';
  
  -- If no settings found, return default
  IF v_settings IS NULL THEN
    RETURN ARRAY['wallet', 'stripe'];
  END IF;
  
  -- Check if country has specific payment methods
  IF v_settings->'country_gateways' ? p_country_code THEN
    v_payment_methods := array(SELECT jsonb_array_elements_text(v_settings->'country_gateways'->p_country_code));
  ELSE
    -- Use default payment methods
    v_payment_methods := array(SELECT jsonb_array_elements_text(v_settings->'default_gateways'));
  END IF;
  
  RETURN v_payment_methods;
END;
$$;