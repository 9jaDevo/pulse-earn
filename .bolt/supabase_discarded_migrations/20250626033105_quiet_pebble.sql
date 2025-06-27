/*
  # Reward Store Redemption System

  1. New Table
    - `redeemed_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `item_id` (text, unique identifier for the store item)
      - `item_name` (text, name of the redeemed item)
      - `points_cost` (integer, points spent on redemption)
      - `status` (text, e.g., 'pending_fulfillment', 'fulfilled', 'cancelled')
      - `fulfillment_details` (jsonb, additional details for fulfillment)
      - `redeemed_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on the table
    - Add policies for users to view their own redeemed items
    - Add policies for admins to manage all redeemed items

  3. Indexes
    - Performance indexes for common queries
    - Indexes for foreign keys
*/

-- Create redeemed_items table
CREATE TABLE IF NOT EXISTS redeemed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  item_name text NOT NULL,
  points_cost integer NOT NULL,
  status text NOT NULL DEFAULT 'pending_fulfillment',
  fulfillment_details jsonb DEFAULT '{}'::jsonb,
  redeemed_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE redeemed_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own redeemed items"
  ON redeemed_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all redeemed items"
  ON redeemed_items
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
CREATE INDEX IF NOT EXISTS idx_redeemed_items_user_id ON redeemed_items(user_id);
CREATE INDEX IF NOT EXISTS idx_redeemed_items_status ON redeemed_items(status);
CREATE INDEX IF NOT EXISTS idx_redeemed_items_redeemed_at ON redeemed_items(redeemed_at DESC);

-- Create trigger for updating updated_at
CREATE TRIGGER update_redeemed_items_updated_at
  BEFORE UPDATE ON redeemed_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE redeemed_items IS 'Stores records of items redeemed by users through the reward store';
COMMENT ON COLUMN redeemed_items.item_id IS 'Unique identifier for the store item (e.g., amazon_gift_card_10)';
COMMENT ON COLUMN redeemed_items.status IS 'Current status of the redemption (pending_fulfillment, fulfilled, cancelled)';
COMMENT ON COLUMN redeemed_items.fulfillment_details IS 'Additional details needed for fulfillment (e.g., delivery address, gift card code)';