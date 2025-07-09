/*
  # Fix Marketing Materials RLS and Storage Configuration

  1. Storage Configuration
    - Create marketing-materials storage bucket if it doesn't exist
    - Set up proper RLS policies for storage bucket

  2. Table RLS Policies
    - Ensure proper RLS policies exist for marketing_materials table
    - Allow admins to perform all operations
    - Allow authenticated users to view active materials

  3. Security
    - Admins can manage all marketing materials
    - Authenticated users can view active materials only
    - Storage bucket allows admin uploads and public reads for active materials
*/

-- Create storage bucket for marketing materials if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketing-materials',
  'marketing-materials',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm'];

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Admins can upload marketing materials" ON storage.objects;
DROP POLICY IF EXISTS "Public can view marketing materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete marketing materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update marketing materials" ON storage.objects;

-- Create storage policies for marketing-materials bucket
CREATE POLICY "Admins can upload marketing materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'marketing-materials' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
);

CREATE POLICY "Public can view marketing materials"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'marketing-materials');

CREATE POLICY "Admins can delete marketing materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'marketing-materials' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
);

CREATE POLICY "Admins can update marketing materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'marketing-materials' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
)
WITH CHECK (
  bucket_id = 'marketing-materials' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )
);

-- Ensure RLS is enabled on marketing_materials table
ALTER TABLE marketing_materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage all marketing materials" ON marketing_materials;
DROP POLICY IF EXISTS "Users can view active marketing materials" ON marketing_materials;
DROP POLICY IF EXISTS "Ambassadors can view active marketing materials" ON marketing_materials;

-- Create comprehensive RLS policies for marketing_materials table
CREATE POLICY "Admins can manage all marketing materials"
ON marketing_materials
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

CREATE POLICY "Users can view active marketing materials"
ON marketing_materials
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Public can view active marketing materials"
ON marketing_materials
FOR SELECT
TO public
USING (is_active = true);