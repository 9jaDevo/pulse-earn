/*
  # Reward Store Items System

  1. New Table
    - `reward_store_items`
      - `id` (uuid, primary key)
      - `name` (text, name of the item)
      - `description` (text, description of the item)
      - `item_type` (text, type of reward: gift_card, bank_transfer, paypal_payout, subscription_code, physical_item)
      - `points_cost` (integer, points required to redeem)
      - `value` (text, e.g., "$10", "1 month")
      - `currency` (text, currency code for monetary rewards)
      - `image_url` (text, URL to item image)
      - `fulfillment_instructions` (text, instructions for fulfillment)
      - `is_active` (boolean, whether item is available)
      - `stock_quantity` (integer, available quantity, null for unlimited)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on the table
    - Add policies for public to view active items
    - Add policies for admins to manage all items

  3. Indexes
    - Performance indexes for common queries
    - Index on is_active for filtering
*/

-- Create reward_store_items table
CREATE TABLE IF NOT EXISTS reward_store_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  item_type text NOT NULL,
  points_cost integer NOT NULL,
  value text,
  currency text,
  image_url text,
  fulfillment_instructions text,
  is_active boolean DEFAULT true,
  stock_quantity integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE reward_store_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active reward items"
  ON reward_store_items
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage all reward items"
  ON reward_store_items
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS reward_store_items_active_idx ON reward_store_items(is_active);
CREATE INDEX IF NOT EXISTS reward_store_items_type_idx ON reward_store_items(item_type);
CREATE INDEX IF NOT EXISTS reward_store_items_cost_idx ON reward_store_items(points_cost);

-- Create trigger for updating updated_at
CREATE TRIGGER update_reward_store_items_updated_at
  BEFORE UPDATE ON reward_store_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample reward items
INSERT INTO reward_store_items (name, description, item_type, points_cost, value, currency, image_url, fulfillment_instructions, is_active, stock_quantity)
VALUES
  ('Amazon Gift Card', '$10 Amazon gift card redeemable worldwide', 'gift_card', 5000, '$10', 'USD', '🎁', 'Gift card code will be sent to your registered email within 24 hours', true, 100),
  ('Netflix Subscription', '1 month of Netflix Standard plan', 'subscription_code', 4500, '1 month', 'USD', '📺', 'Subscription code will be sent to your registered email', true, 50),
  ('Spotify Premium', '3 months of Spotify Premium', 'subscription_code', 3500, '3 months', 'USD', '🎵', 'Redemption instructions will be sent to your email', true, 75),
  ('PayPal Cash', 'Cash transferred directly to your PayPal account', 'paypal_payout', 12000, '$25', 'USD', '💰', 'Please ensure your email is linked to a valid PayPal account', true, null),
  ('Bank Transfer', 'Direct bank transfer to your account', 'bank_transfer', 20000, '$50', 'USD', '🏦', 'You will be contacted to provide your bank details securely', true, null),
  ('Gaming Mouse', 'High-performance gaming mouse with RGB lighting', 'physical_item', 15000, 'Gaming Mouse', null, '🖱️', 'Please provide your shipping address when prompted', true, 25),
  ('Wireless Earbuds', 'Premium wireless earbuds with noise cancellation', 'physical_item', 18000, 'Wireless Earbuds', null, '🎧', 'Please provide your shipping address when prompted', true, 15),
  ('Custom T-Shirt', 'PollPeak branded t-shirt', 'physical_item', 8000, 'T-Shirt', null, '👕', 'You will be contacted to confirm size and shipping details', true, 50);