CREATE POLICY "Allow vote‐count updates"
  ON polls
  FOR UPDATE
  TO authenticated
  USING (true)         -- allow the row to be selected for update
  WITH CHECK (true);   -- allow any new values
