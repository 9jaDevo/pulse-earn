/*
  # Poll Comments and Reporting System

  1. New Tables
    - `poll_comments`
      - `id` (uuid, primary key)
      - `poll_id` (uuid, references polls)
      - `user_id` (uuid, references profiles)
      - `comment_text` (text, not null)
      - `parent_comment_id` (uuid, self-reference for replies)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_active` (boolean, for soft deletion)
    
    - `content_reports`
      - `id` (uuid, primary key)
      - `reporter_id` (uuid, references profiles)
      - `content_type` (text, e.g., 'poll', 'comment')
      - `content_id` (uuid, the ID of the reported content)
      - `reason` (text, reason for reporting)
      - `status` (text, e.g., 'pending', 'reviewed', 'resolved')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `resolved_by` (uuid, references profiles, nullable)
      - `resolution_notes` (text, nullable)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to create and view comments
    - Add policies for users to report content
    - Add policies for moderators to manage reports

  3. Indexes
    - Performance indexes for common queries
    - Indexes for foreign keys
*/

-- Create poll_comments table
CREATE TABLE IF NOT EXISTS poll_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  parent_comment_id uuid REFERENCES poll_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);

-- Create content_reports table
CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes text
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_poll_comments_poll_id ON poll_comments(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_comments_user_id ON poll_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_comments_parent_id ON poll_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_poll_comments_created_at ON poll_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poll_comments_is_active ON poll_comments(is_active);

CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE poll_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Policies for poll_comments
CREATE POLICY "Users can view active comments"
  ON poll_comments
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can insert their own comments"
  ON poll_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON poll_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON poll_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for content_reports
CREATE POLICY "Users can create reports"
  ON content_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON content_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Moderators can view all reports"
  ON content_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "Moderators can update reports"
  ON content_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('moderator', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('moderator', 'admin')
    )
  );

-- Create triggers for updated_at columns
CREATE TRIGGER update_poll_comments_updated_at
  BEFORE UPDATE ON poll_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_reports_updated_at
  BEFORE UPDATE ON content_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add admin policies for both tables
CREATE POLICY "Admins can manage all comments"
  ON poll_comments
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

CREATE POLICY "Admins can manage all reports"
  ON content_reports
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

-- Add soft delete function for polls (archive instead of delete)
CREATE OR REPLACE FUNCTION archive_poll(p_poll_id uuid, p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_success boolean := false;
  v_error text;
  v_poll_exists boolean;
  v_is_authorized boolean;
BEGIN
  -- Check if poll exists
  SELECT EXISTS(SELECT 1 FROM polls WHERE id = p_poll_id) INTO v_poll_exists;
  
  IF NOT v_poll_exists THEN
    RAISE EXCEPTION 'Poll with ID % does not exist', p_poll_id;
  END IF;
  
  -- Check if user is authorized (creator or admin)
  SELECT EXISTS(
    SELECT 1 FROM polls p
    JOIN profiles pr ON pr.id = p_user_id
    WHERE p.id = p_poll_id AND (p.created_by = p_user_id OR pr.role = 'admin')
  ) INTO v_is_authorized;
  
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'User % is not authorized to archive poll %', p_user_id, p_poll_id;
  END IF;
  
  -- Update poll to set is_active = false (archive)
  UPDATE polls
  SET is_active = false,
      updated_at = now()
  WHERE id = p_poll_id;
  
  -- Log the action
  INSERT INTO moderator_actions (
    moderator_id,
    action_type,
    target_id,
    target_table,
    reason,
    metadata
  ) VALUES (
    p_user_id,
    'archive_poll',
    p_poll_id,
    'polls',
    'User archived poll',
    jsonb_build_object('poll_id', p_poll_id)
  );
  
  v_success := true;
  
  RETURN v_success;
EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RAISE NOTICE 'Error archiving poll %: %', p_poll_id, v_error;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add restore function for archived polls
CREATE OR REPLACE FUNCTION restore_poll(p_poll_id uuid, p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_success boolean := false;
  v_error text;
  v_poll_exists boolean;
  v_is_authorized boolean;
BEGIN
  -- Check if poll exists
  SELECT EXISTS(SELECT 1 FROM polls WHERE id = p_poll_id) INTO v_poll_exists;
  
  IF NOT v_poll_exists THEN
    RAISE EXCEPTION 'Poll with ID % does not exist', p_poll_id;
  END IF;
  
  -- Check if user is authorized (creator or admin)
  SELECT EXISTS(
    SELECT 1 FROM polls p
    JOIN profiles pr ON pr.id = p_user_id
    WHERE p.id = p_poll_id AND (p.created_by = p_user_id OR pr.role = 'admin')
  ) INTO v_is_authorized;
  
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'User % is not authorized to restore poll %', p_user_id, p_poll_id;
  END IF;
  
  -- Update poll to set is_active = true (restore)
  UPDATE polls
  SET is_active = true,
      updated_at = now()
  WHERE id = p_poll_id;
  
  -- Log the action
  INSERT INTO moderator_actions (
    moderator_id,
    action_type,
    target_id,
    target_table,
    reason,
    metadata
  ) VALUES (
    p_user_id,
    'restore_poll',
    p_poll_id,
    'polls',
    'User restored poll',
    jsonb_build_object('poll_id', p_poll_id)
  );
  
  v_success := true;
  
  RETURN v_success;
EXCEPTION
  WHEN OTHERS THEN
    v_error := SQLERRM;
    RAISE NOTICE 'Error restoring poll %: %', p_poll_id, v_error;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION archive_poll(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_poll(uuid, uuid) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE poll_comments IS 'Stores user comments on polls with support for threaded replies';
COMMENT ON TABLE content_reports IS 'Stores user reports of inappropriate content';
COMMENT ON FUNCTION archive_poll(uuid, uuid) IS 'Archives a poll by setting is_active to false';
COMMENT ON FUNCTION restore_poll(uuid, uuid) IS 'Restores an archived poll by setting is_active to true';