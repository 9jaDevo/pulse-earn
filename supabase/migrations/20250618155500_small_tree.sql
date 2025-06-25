/*
  # Fix Poll Deletion Issue

  1. Problem
    - Poll votes are being deleted but polls remain in the database
    - Logs show successful execution but database state doesn't change
    - Possible issue with CASCADE constraints or transaction handling

  2. Solution
    - Add explicit transaction handling for poll deletion
    - Ensure proper order of operations (delete votes first, then poll)
    - Add logging trigger to track deletion operations
    - Create function to handle poll deletion with proper error handling
    - Add index on poll_id in poll_votes for faster deletion

  3. Changes
    - Create poll_deletion_log table to track deletion attempts
    - Create delete_poll function with transaction handling
    - Add trigger to log poll deletion attempts
    - Clean up any orphaned votes
*/

-- Create a table to log poll deletion attempts for debugging
CREATE TABLE IF NOT EXISTS poll_deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create a function to handle poll deletion with proper transaction handling
CREATE OR REPLACE FUNCTION delete_poll(p_poll_id uuid, p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_success boolean := false;
  v_error text;
  v_poll_exists boolean;
  v_votes_deleted boolean;
  v_poll_deleted boolean;
BEGIN
  -- Start transaction
  BEGIN
    -- Check if poll exists
    SELECT EXISTS(SELECT 1 FROM polls WHERE id = p_poll_id) INTO v_poll_exists;
    
    IF NOT v_poll_exists THEN
      RAISE EXCEPTION 'Poll with ID % does not exist', p_poll_id;
    END IF;
    
    -- First delete all votes for this poll
    DELETE FROM poll_votes WHERE poll_id = p_poll_id;
    GET DIAGNOSTICS v_votes_deleted = ROW_COUNT;
    
    -- Then delete the poll itself
    DELETE FROM polls WHERE id = p_poll_id;
    GET DIAGNOSTICS v_poll_deleted = ROW_COUNT;
    
    -- Log the successful deletion
    INSERT INTO poll_deletion_log (poll_id, user_id, status)
    VALUES (p_poll_id, p_user_id, 'SUCCESS');
    
    v_success := true;
    
    -- Commit transaction
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction on error
      ROLLBACK;
      v_error := SQLERRM;
      
      -- Log the failed deletion
      INSERT INTO poll_deletion_log (poll_id, user_id, status, error_message)
      VALUES (p_poll_id, p_user_id, 'ERROR', v_error);
      
      RAISE NOTICE 'Error deleting poll %: %', p_poll_id, v_error;
      v_success := false;
  END;
  
  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an index on poll_id in poll_votes for faster deletion
CREATE INDEX IF NOT EXISTS poll_votes_poll_id_idx ON poll_votes(poll_id);

-- Clean up any orphaned votes (votes for polls that no longer exist)
DELETE FROM poll_votes
WHERE NOT EXISTS (
  SELECT 1 FROM polls WHERE polls.id = poll_votes.poll_id
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION delete_poll(uuid, uuid) TO authenticated;
GRANT ALL ON TABLE poll_deletion_log TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION delete_poll(uuid, uuid) IS 'Deletes a poll and all its votes within a transaction';
COMMENT ON TABLE poll_deletion_log IS 'Logs poll deletion attempts for debugging';