/*
  # Create user profiles table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique, not null)
      - `name` (text, nullable)
      - `avatar_url` (text, nullable)
      - `country` (text, nullable)
      - `role` (enum: user, moderator, ambassador, admin)
      - `points` (integer, default 0)
      - `badges` (text array, default empty array)
      - `created_at` (timestamp with timezone, default now())
      - `updated_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for users to read/update their own profile
    - Add policy for public read access to basic profile info
    - Add policy for admins to manage all profiles

  3. Functions
    - Create function to handle user registration
    - Create trigger to automatically create profile on user signup
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'ambassador', 'admin');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  country text,
  role user_role DEFAULT 'user' NOT NULL,
  points integer DEFAULT 0 NOT NULL,
  badges text[] DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_points_idx ON profiles(points DESC);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at DESC);