/*
  # Add Marketing Module Setting

  1. Changes
    - Add a new entry to app_settings table for marketing module
    - Default setting is enabled (true)
*/

-- Insert marketing module settings if they don't exist
INSERT INTO app_settings (category, settings)
VALUES (
  'marketing',
  jsonb_build_object(
    'is_enabled', true,
    'allowed_file_types', ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4'],
    'max_file_size_mb', 10,
    'default_material_types', ARRAY['banner', 'social_template', 'flyer', 'video', 'presentation']
  )
)
ON CONFLICT (category) 
DO UPDATE SET 
  settings = app_settings.settings || excluded.settings,
  updated_at = now();