/*
  # Create Contest Functions

  1. Functions
    - `enroll_in_contest(p_user_id, p_contest_id)`: Handles points deduction and enrollment
    - `get_contest_play_status(p_user_id, p_contest_id)`: Checks if user can play contest
    - `submit_contest_score(p_user_id, p_contest_id, p_score)`: Records user's score
    - `disburse_contest_prizes(p_admin_id, p_contest_id)`: Distributes prizes to winners

  2. Security
    - Grant execute permissions for authenticated users
*/

-- Function to enroll user in contest using points
CREATE OR REPLACE FUNCTION enroll_in_contest(
  p_user_id uuid,
  p_contest_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contest_record trivia_contests%ROWTYPE;
  v_user_points integer;
  v_enrollment_id uuid;
BEGIN
  -- Get contest details
  SELECT * INTO v_contest_record
  FROM trivia_contests
  WHERE id = p_contest_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Contest not found');
  END IF;
  
  -- Check if contest is in enrolling status
  IF v_contest_record.status NOT IN ('upcoming', 'enrolling') THEN
    RETURN json_build_object('success', false, 'error', 'Contest enrollment is closed');
  END IF;
  
  -- Check if user is already enrolled
  IF EXISTS (
    SELECT 1 FROM contest_enrollments 
    WHERE contest_id = p_contest_id AND user_id = p_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Already enrolled in this contest');
  END IF;
  
  -- Get user's current points
  SELECT points INTO v_user_points
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_user_points < v_contest_record.entry_fee THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient points');
  END IF;
  
  -- Deduct points from user
  UPDATE profiles
  SET points = points - v_contest_record.entry_fee
  WHERE id = p_user_id;
  
  -- Create enrollment record
  INSERT INTO contest_enrollments (contest_id, user_id, payment_status)
  VALUES (p_contest_id, p_user_id, 'paid')
  RETURNING id INTO v_enrollment_id;
  
  -- Record transaction in daily_reward_history
  INSERT INTO daily_reward_history (user_id, reward_type, points_earned, description)
  VALUES (
    p_user_id, 
    'contest_prize', 
    -v_contest_record.entry_fee,
    'Contest entry fee for: ' || v_contest_record.title
  );
  
  RETURN json_build_object(
    'success', true, 
    'enrollment_id', v_enrollment_id,
    'points_deducted', v_contest_record.entry_fee
  );
END;
$$;

-- Function to check if user can play contest
CREATE OR REPLACE FUNCTION get_contest_play_status(
  p_user_id uuid,
  p_contest_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contest_record trivia_contests%ROWTYPE;
  v_enrollment_record contest_enrollments%ROWTYPE;
  v_can_play boolean := false;
  v_message text := '';
BEGIN
  -- Get contest details
  SELECT * INTO v_contest_record
  FROM trivia_contests
  WHERE id = p_contest_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('can_play', false, 'message', 'Contest not found');
  END IF;
  
  -- Get enrollment details
  SELECT * INTO v_enrollment_record
  FROM contest_enrollments
  WHERE contest_id = p_contest_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('can_play', false, 'message', 'Not enrolled in this contest');
  END IF;
  
  -- Check payment status
  IF v_enrollment_record.payment_status != 'paid' THEN
    RETURN json_build_object('can_play', false, 'message', 'Payment not completed');
  END IF;
  
  -- Check if already played
  IF v_enrollment_record.has_played THEN
    RETURN json_build_object('can_play', false, 'message', 'Already completed this contest');
  END IF;
  
  -- Check contest status and timing
  IF v_contest_record.status = 'active' AND 
     now() >= v_contest_record.start_time AND 
     now() <= v_contest_record.end_time THEN
    v_can_play := true;
    v_message := 'Ready to play';
  ELSIF v_contest_record.status = 'upcoming' THEN
    v_message := 'Contest has not started yet';
  ELSIF v_contest_record.status = 'ended' THEN
    v_message := 'Contest has ended';
  ELSE
    v_message := 'Contest is not available for play';
  END IF;
  
  RETURN json_build_object('can_play', v_can_play, 'message', v_message);
END;
$$;

-- Function to submit contest score
CREATE OR REPLACE FUNCTION submit_contest_score(
  p_user_id uuid,
  p_contest_id uuid,
  p_score integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contest_record trivia_contests%ROWTYPE;
  v_enrollment_record contest_enrollments%ROWTYPE;
BEGIN
  -- Get contest details
  SELECT * INTO v_contest_record
  FROM trivia_contests
  WHERE id = p_contest_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Contest not found');
  END IF;
  
  -- Check if contest is active
  IF v_contest_record.status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Contest is not active');
  END IF;
  
  -- Get enrollment details
  SELECT * INTO v_enrollment_record
  FROM contest_enrollments
  WHERE contest_id = p_contest_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Not enrolled in this contest');
  END IF;
  
  -- Check if already played
  IF v_enrollment_record.has_played THEN
    RETURN json_build_object('success', false, 'error', 'Score already submitted');
  END IF;
  
  -- Check payment status
  IF v_enrollment_record.payment_status != 'paid' THEN
    RETURN json_build_object('success', false, 'error', 'Payment not completed');
  END IF;
  
  -- Update enrollment with score
  UPDATE contest_enrollments
  SET score = p_score, has_played = true
  WHERE contest_id = p_contest_id AND user_id = p_user_id;
  
  RETURN json_build_object('success', true, 'score', p_score);
END;
$$;

-- Function to disburse contest prizes
CREATE OR REPLACE FUNCTION disburse_contest_prizes(
  p_admin_id uuid,
  p_contest_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contest_record trivia_contests%ROWTYPE;
  v_admin_role text;
  v_winner_record contest_enrollments%ROWTYPE;
  v_prize_amount numeric;
  v_winners_count integer := 0;
  v_total_disbursed numeric := 0;
BEGIN
  -- Check if user is admin
  SELECT role INTO v_admin_role
  FROM profiles
  WHERE id = p_admin_id;
  
  IF v_admin_role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  -- Get contest details
  SELECT * INTO v_contest_record
  FROM trivia_contests
  WHERE id = p_contest_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Contest not found');
  END IF;
  
  -- Check if contest has ended
  IF v_contest_record.status != 'ended' THEN
    RETURN json_build_object('success', false, 'error', 'Contest must be ended before disbursing prizes');
  END IF;
  
  -- Calculate and assign ranks based on scores
  WITH ranked_players AS (
    SELECT 
      id,
      user_id,
      score,
      ROW_NUMBER() OVER (ORDER BY score DESC, enrollment_time ASC) as calculated_rank
    FROM contest_enrollments
    WHERE contest_id = p_contest_id 
    AND has_played = true 
    AND score IS NOT NULL
  )
  UPDATE contest_enrollments ce
  SET rank = rp.calculated_rank
  FROM ranked_players rp
  WHERE ce.id = rp.id;
  
  -- Disburse prizes to winners
  FOR v_winner_record IN
    SELECT * FROM contest_enrollments
    WHERE contest_id = p_contest_id 
    AND rank IS NOT NULL 
    AND rank <= v_contest_record.num_winners
    ORDER BY rank
  LOOP
    -- Calculate prize amount (simple equal distribution for now)
    v_prize_amount := v_contest_record.prize_pool_amount / v_contest_record.num_winners;
    
    -- Update winner's points
    UPDATE profiles
    SET points = points + v_prize_amount::integer
    WHERE id = v_winner_record.user_id;
    
    -- Update enrollment with prize amount
    UPDATE contest_enrollments
    SET prize_awarded = v_prize_amount
    WHERE id = v_winner_record.id;
    
    -- Record prize in daily_reward_history
    INSERT INTO daily_reward_history (user_id, reward_type, points_earned, description)
    VALUES (
      v_winner_record.user_id,
      'contest_prize',
      v_prize_amount::integer,
      'Contest prize for rank ' || v_winner_record.rank || ' in: ' || v_contest_record.title
    );
    
    v_winners_count := v_winners_count + 1;
    v_total_disbursed := v_total_disbursed + v_prize_amount;
  END LOOP;
  
  -- Update contest status to disbursed
  UPDATE trivia_contests
  SET status = 'disbursed'
  WHERE id = p_contest_id;
  
  RETURN json_build_object(
    'success', true,
    'winners_count', v_winners_count,
    'total_disbursed', v_total_disbursed
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION enroll_in_contest(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_contest_play_status(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_contest_score(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION disburse_contest_prizes(uuid, uuid) TO authenticated;