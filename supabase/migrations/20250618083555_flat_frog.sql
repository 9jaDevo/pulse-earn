/*
  # Create Poll Categories System

  1. New Tables
    - `poll_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `poll_categories` table
    - Add policy for authenticated users to view active categories
    - Add policy for admins to manage all categories

  3. Data
    - Seed table with 25 common poll categories
*/

-- Create poll_categories table
CREATE TABLE IF NOT EXISTS poll_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE poll_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active categories"
  ON poll_categories
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage all categories"
  ON poll_categories
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_poll_categories_updated_at
BEFORE UPDATE ON poll_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Seed common categories
INSERT INTO poll_categories (name, description) VALUES
('Technology', 'Questions about gadgets, software, and tech trends'),
('Politics', 'Political opinions and current affairs'),
('Entertainment', 'Movies, TV shows, music, and pop culture'),
('Sports', 'Sports teams, events, and athletes'),
('Food', 'Culinary preferences, recipes, and dining'),
('Travel', 'Destinations, travel tips, and experiences'),
('Health', 'Health topics, fitness, and wellness'),
('Education', 'Learning, schools, and educational topics'),
('Environment', 'Climate change, conservation, and sustainability'),
('Business', 'Business trends, entrepreneurship, and finance'),
('Science', 'Scientific discoveries and research'),
('Gaming', 'Video games, board games, and gaming culture'),
('Fashion', 'Clothing, style, and fashion trends'),
('Pets', 'Pet care, animal behavior, and pet preferences'),
('Relationships', 'Dating, family, and interpersonal relationships'),
('Career', 'Jobs, workplace, and professional development'),
('Hobbies', 'Crafts, collections, and leisure activities'),
('Social Media', 'Platforms, trends, and online behavior'),
('Current Events', 'Recent news and happenings'),
('Philosophy', 'Ethical questions and philosophical debates'),
('Art', 'Visual arts, design, and creative expression'),
('Books', 'Literature, reading habits, and authors'),
('Music', 'Musical preferences, artists, and genres'),
('Lifestyle', 'Daily habits, home, and lifestyle choices'),
('General', 'Miscellaneous topics that don''t fit other categories');