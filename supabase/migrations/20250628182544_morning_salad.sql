/*
  # Marketing Materials System

  1. New Tables
    - `marketing_materials`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text, nullable)
      - `file_url` (text, not null)
      - `file_path` (text, not null)
      - `file_type` (text, not null)
      - `material_type` (text, not null)
      - `created_by` (uuid, foreign key)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `marketing_materials` table
    - Add policies for admins to manage all materials
    - Add policies for ambassadors to view active materials
    - Add policies for users to view active materials
*/

-- Create marketing_materials table
CREATE TABLE IF NOT EXISTS marketing_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  material_type text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS marketing_materials_material_type_idx ON marketing_materials(material_type);
CREATE INDEX IF NOT EXISTS marketing_materials_is_active_idx ON marketing_materials(is_active);
CREATE INDEX IF NOT EXISTS marketing_materials_created_by_idx ON marketing_materials(created_by);

-- Enable Row Level Security
ALTER TABLE marketing_materials ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admins can manage all marketing materials
CREATE POLICY "Admins can manage all marketing materials"
ON marketing_materials
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Ambassadors can view active marketing materials
CREATE POLICY "Ambassadors can view active marketing materials"
ON marketing_materials
FOR SELECT
TO authenticated
USING (
  is_active = true AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'ambassador'
  )
);

-- Users can view active marketing materials
CREATE POLICY "Users can view active marketing materials"
ON marketing_materials
FOR SELECT
TO authenticated
USING (
  is_active = true
);

-- Create trigger to update updated_at column
CREATE TRIGGER update_marketing_materials_updated_at
BEFORE UPDATE ON marketing_materials
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();