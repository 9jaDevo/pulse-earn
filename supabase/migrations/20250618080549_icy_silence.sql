/*
  # Add missing columns to polls table

  1. New Columns
    - `category` (text) - Category classification for polls (e.g., Technology, Sports, Entertainment)
    - `start_date` (timestamptz) - When the poll should start accepting votes (optional)

  2. Changes
    - Add category column with default value 'General'
    - Add start_date column as nullable for optional scheduled polls
    - Add indexes for better query performance

  3. Notes
    - These columns are expected by the application code but missing from the current schema
    - Category helps organize and filter polls
    - Start date enables scheduled polls that activate at a future time
*/

-- Add category column with default value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'category'
  ) THEN
    ALTER TABLE polls ADD COLUMN category text DEFAULT 'General';
  END IF;
END $$;

-- Add start_date column for scheduled polls
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE polls ADD COLUMN start_date timestamptz;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS polls_category_idx ON polls(category);
CREATE INDEX IF NOT EXISTS polls_start_date_idx ON polls(start_date);

-- Update existing polls to have a category if they don't have one
UPDATE polls SET category = 'General' WHERE category IS NULL;