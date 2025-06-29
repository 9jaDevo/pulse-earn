/*
  # Fix Promoted Poll Deletion

  1. Problem
    - Deletion of promoted polls fails with error: "JSON object requested, multiple (or no) rows returned"
    - This happens because the current implementation expects a single row to be returned after deletion
    - PostgreSQL DELETE operations don't return rows by default when using single()

  2. Solution
    - Create a function to handle promoted poll deletion properly
    - Return a boolean success value instead of expecting a row
    - Add proper error handling and transaction management
    - Ensure proper authorization checks

  3. Changes
    - Create delete_promoted_poll function with proper error handling
    - Add logging for debugging purposes
    - Ensure proper transaction management
*/

-- Create a table to log promoted poll deletion attempts for debugging
CREATE TABLE IF NOT EXISTS promoted_poll_deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promoted_poll_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create a function to handle promoted poll deletion with proper transaction handling
CREATE OR REPLACE FUNCTION delete_promoted_poll(p_promoted_poll_id uuid, p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_success boolean := false;
  v_error text;
  v_poll_exists boolean;
  v_is_owner boolean;
  v_is_admin boolean;
  v_poll_deleted boolean;
BEGIN
  -- Start transaction
  BEGIN
    -- Check if promoted poll exists
    SELECT EXISTS(SELECT 1 FROM promoted_polls WHERE id = p_promoted_poll_id) INTO v_poll_exists;
    
    IF NOT v_poll_exists THEN
      RAISE EXCEPTION 'Promoted poll with ID % does not exist', p_promoted_poll_id;
    END IF;
    
    -- Check if user is owner or admin
    SELECT EXISTS(
      SELECT 1 FROM promoted_polls pp
      JOIN sponsors s ON pp.sponsor_id = s.id
      WHERE pp.id = p_promoted_poll_id AND s.user_id = p_user_id
    ) INTO v_is_owner;
    
    SELECT EXISTS(
      SELECT 1 FROM profiles
      WHERE id = p_user_id AND role = 'admin'
    ) INTO v_is_admin;
    
    IF NOT (v_is_owner OR v_is_admin) THEN
      RAISE EXCEPTION 'User % is not authorized to delete promoted poll %', p_user_id, p_promoted_poll_id;
    END IF;
    
    -- Delete the promoted poll
    DELETE FROM promoted_polls WHERE id = p_promoted_poll_id;
    GET DIAGNOSTICS v_poll_deleted = ROW_COUNT;
    
    -- Log the successful deletion
    INSERT INTO promoted_poll_deletion_log (promoted_poll_id, user_id, status)
    VALUES (p_promoted_poll_id, p_user_id, 'SUCCESS');
    
    v_success := true;
    
    -- Commit transaction
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction on error
      ROLLBACK;
      v_error := SQLERRM;
      
      -- Log the failed deletion
      INSERT INTO promoted_poll_deletion_log (promoted_poll_id, user_id, status, error_message)
      VALUES (p_promoted_poll_id, p_user_id, 'ERROR', v_error);
      
      RAISE NOTICE 'Error deleting promoted poll %: %', p_promoted_poll_id, v_error;
      v_success := false;
  END;
  
  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION delete_promoted_poll(uuid, uuid) TO authenticated;
GRANT ALL ON TABLE promoted_poll_deletion_log TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION delete_promoted_poll(uuid, uuid) IS 'Deletes a promoted poll with proper authorization checks and error handling';
COMMENT ON TABLE promoted_poll_deletion_log IS 'Logs promoted poll deletion attempts for debugging';