-- Replace existing function
CREATE OR REPLACE FUNCTION update_poll_vote_counts()
RETURNS trigger AS $$
DECLARE
  v_poll_id UUID;
  v_vote_option INTEGER;
  v_current_options JSONB;
  v_total_votes INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_poll_id := NEW.poll_id;
    v_vote_option := NEW.vote_option;
  ELSIF TG_OP = 'DELETE' THEN
    v_poll_id := OLD.poll_id;
    v_vote_option := OLD.vote_option;
  ELSE
    RETURN NULL;
  END IF;

  SELECT options, total_votes
    INTO v_current_options, v_total_votes
    FROM polls
   WHERE id = v_poll_id;

  IF TG_OP = 'INSERT' THEN
    v_current_options := jsonb_set(
      v_current_options,
      ARRAY[v_vote_option::text, 'votes'],
      ((v_current_options -> v_vote_option ->> 'votes')::int + 1)::text::jsonb
    );
    v_total_votes := v_total_votes + 1;
  ELSIF TG_OP = 'DELETE' THEN
    v_current_options := jsonb_set(
      v_current_options,
      ARRAY[v_vote_option::text, 'votes'],
      ((v_current_options -> v_vote_option ->> 'votes')::int - 1)::text::jsonb
    );
    v_total_votes := v_total_votes - 1;
  END IF;

  UPDATE polls
     SET options      = v_current_options,
         total_votes  = v_total_votes,
         updated_at   = now()
   WHERE id = v_poll_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any, then create a new one
DROP TRIGGER IF EXISTS update_poll_vote_counts_trigger ON poll_votes;

CREATE TRIGGER update_poll_vote_counts_trigger
  AFTER INSERT OR DELETE
  ON poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_vote_counts();
