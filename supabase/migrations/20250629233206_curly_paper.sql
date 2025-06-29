/*
  # Create promoted_poll_deletion_log table for tracking deletions

  1. New Table
    - `promoted_poll_deletion_log` - Tracks deletion attempts for promoted polls
      - `id` (uuid, primary key)
      - `promoted_poll_id` (uuid, not null)
      - `user_id` (uuid, not null)
      - `status` (text, not null)
      - `error_message` (text)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on the table
    - Add policy for admins to view all logs
    - Add policy for users to view their own logs
*/

-- Create promoted_poll_deletion_log table
CREATE TABLE IF NOT EXISTS promoted_poll_deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promoted_poll_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS promoted_poll_deletion_log_promoted_poll_id_idx ON promoted_poll_deletion_log(promoted_poll_id);
CREATE INDEX IF NOT EXISTS promoted_poll_deletion_log_user_id_idx ON promoted_poll_deletion_log(user_id);
CREATE INDEX IF NOT EXISTS promoted_poll_deletion_log_status_idx ON promoted_poll_deletion_log(status);

-- Enable Row Level Security
ALTER TABLE promoted_poll_deletion_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all deletion logs"
  ON promoted_poll_deletion_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own deletion logs"
  ON promoted_poll_deletion_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create policy for service role to insert logs
CREATE POLICY "Service role can insert deletion logs"
  ON promoted_poll_deletion_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE promoted_poll_deletion_log IS 'Logs promoted poll deletion attempts for debugging and auditing';