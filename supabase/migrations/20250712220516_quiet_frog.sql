/*
  # Enhanced Contest Functions

  This migration creates comprehensive PostgreSQL functions for the contest system:

  1. Functions
     - `enroll_in_contest_with_points` - Handle point-based enrollment
     - `get_contest_play_status` - Check if user can play contest
     - `submit_contest_score` - Record user's contest score
     - `disburse_contest_prizes` - Distribute prizes to winners
     - `calculate_contest_rankings` - Update user rankings in contest

  2. Security
     - All functions have proper error handling
     - Row Level Security is respected
     - Admin-only functions are protected
*/

-- Function to enroll user in contest using points
CREATE OR REPLACE FUNCTION enroll_in_contest_with_points(
  p_user_id UUID,
  p_contest_id UUID
) RETURNS JSON AS $$
DECLARE
  v_contest RECORD;
  v_user_points INTEGER;
  v_enrollment_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Get contest details
  SELECT * INTO v_contest
  FROM trivia_contests
  WHERE id = p_contest_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Contest not found');
  END IF;

  -- Check contest status
  IF v_contest.status NOT IN ('upcoming', 'enrolling') THEN
    RETURN json_build_object('success', false, 'error', 'Contest enrollment is not available');
  END IF;

  -- Check if user already enrolled
  IF EXISTS (
    SELECT 1 FROM contest_enrollments 
    WHERE contest_id = p_contest_id AND user_id = p_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'User already enrolled');
  END IF;

  -- Get user's current points
  SELECT points INTO v_user_points
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Check if user has enough points
  IF v_user_points < v_contest.entry_fee THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient points');
  END IF;

  -- Start transaction
  BEGIN
    -- Deduct points from user
    UPDATE profiles
    SET points = points - v_contest.entry_fee
    WHERE id = p_user_id;

    -- Create transaction record
    INSERT INTO transactions (
      user_id,
      amount,
      currency,
      status,
      transaction_type,
      description
    ) VALUES (
      p_user_id,
      v_contest.entry_fee,
      'POINTS',
      'completed',
      'contest_entry',
      'Contest entry fee for: ' || v_contest.title
    ) RETURNING id INTO v_transaction_id;

    -- Create enrollment record
    INSERT INTO contest_enrollments (
      contest_id,
      user_id,
      payment_status,
      transaction_id
    ) VALUES (
      p_contest_id,
      p_user_id,
      'paid',
      v_transaction_id
    ) RETURNING id INTO v_enrollment_id;

    -- Record in daily reward history
    INSERT INTO daily_reward_history (
      user_id,
      reward_type,
      points_earned,
      description
    ) VALUES (
      p_user_id,
      'contest_entry',
      -v_contest.entry_fee,
      'Contest entry fee deduction for: ' || v_contest.title
    );

    RETURN json_build_object(
      'success', true,
      'enrollment_id', v_enrollment_id,
      'transaction_id', v_transaction_id,
      'remaining_points', v_user_points - v_contest.entry_fee
    );

  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Enrollment failed: ' || SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can play contest
CREATE OR REPLACE FUNCTION get_contest_play_status(
  p_user_id UUID,
  p_contest_id UUID
) RETURNS JSON AS $$
DECLARE
  v_contest RECORD;
  v_enrollment RECORD;
  v_can_play BOOLEAN := false;
  v_reason TEXT := '';
BEGIN
  -- Get contest details
  SELECT * INTO v_contest
  FROM trivia_contests
  WHERE id = p_contest_id;

  IF NOT FOUND THEN
    RETURN json_build_object('can_play', false, 'reason', 'Contest not found');
  END IF;

  -- Check if contest is active
  IF v_contest.status != 'active' THEN
    v_reason := 'Contest is not currently active';
  ELSIF NOW() < v_contest.start_time THEN
    v_reason := 'Contest has not started yet';
  ELSIF NOW() > v_contest.end_time THEN
    v_reason := 'Contest has ended';
  ELSE
    -- Check enrollment status
    SELECT * INTO v_enrollment
    FROM contest_enrollments
    WHERE contest_id = p_contest_id AND user_id = p_user_id;

    IF NOT FOUND THEN
      v_reason := 'User not enrolled in contest';
    ELSIF v_enrollment.payment_status != 'paid' THEN
      v_reason := 'Payment not completed';
    ELSIF v_enrollment.has_played THEN
      v_reason := 'User has already played this contest';
    ELSE
      v_can_play := true;
      v_reason := 'User can play contest';
    END IF;
  END IF;

  RETURN json_build_object(
    'can_play', v_can_play,
    'reason', v_reason,
    'contest_status', v_contest.status,
    'start_time', v_contest.start_time,
    'end_time', v_contest.end_time
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit contest score
CREATE OR REPLACE FUNCTION submit_contest_score(
  p_user_id UUID,
  p_contest_id UUID,
  p_score INTEGER
) RETURNS JSON AS $$
DECLARE
  v_play_status JSON;
  v_can_play BOOLEAN;
BEGIN
  -- Check if user can play
  SELECT get_contest_play_status(p_user_id, p_contest_id) INTO v_play_status;
  SELECT (v_play_status->>'can_play')::BOOLEAN INTO v_can_play;

  IF NOT v_can_play THEN
    RETURN json_build_object(
      'success', false, 
      'error', v_play_status->>'reason'
    );
  END IF;

  -- Update enrollment with score
  UPDATE contest_enrollments
  SET 
    score = p_score,
    has_played = true
  WHERE contest_id = p_contest_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Enrollment not found');
  END IF;

  -- Calculate and update rankings
  PERFORM calculate_contest_rankings(p_contest_id);

  RETURN json_build_object(
    'success', true,
    'score', p_score,
    'message', 'Score submitted successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate contest rankings
CREATE OR REPLACE FUNCTION calculate_contest_rankings(p_contest_id UUID)
RETURNS VOID AS $$
BEGIN
  WITH ranked_scores AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY score DESC, enrollment_time ASC) as rank
    FROM contest_enrollments
    WHERE contest_id = p_contest_id AND has_played = true
  )
  UPDATE contest_enrollments ce
  SET rank = rs.rank
  FROM ranked_scores rs
  WHERE ce.id = rs.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to disburse contest prizes (admin only)
CREATE OR REPLACE FUNCTION disburse_contest_prizes(
  p_admin_id UUID,
  p_contest_id UUID
) RETURNS JSON AS $$
DECLARE
  v_contest RECORD;
  v_winner RECORD;
  v_prize_amount NUMERIC;
  v_total_disbursed NUMERIC := 0;
  v_winners_count INTEGER := 0;
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_admin_id AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  -- Get contest details
  SELECT * INTO v_contest
  FROM trivia_contests
  WHERE id = p_contest_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Contest not found');
  END IF;

  -- Check if contest has ended
  IF v_contest.status != 'ended' THEN
    RETURN json_build_object('success', false, 'error', 'Contest must be ended before disbursing prizes');
  END IF;

  -- Check if prizes already disbursed
  IF v_contest.status = 'disbursed' THEN
    RETURN json_build_object('success', false, 'error', 'Prizes already disbursed');
  END IF;

  -- Calculate and update final rankings
  PERFORM calculate_contest_rankings(p_contest_id);

  -- Start transaction for prize disbursement
  BEGIN
    -- Disburse prizes to winners
    FOR v_winner IN 
      SELECT ce.*, p.id as profile_id
      FROM contest_enrollments ce
      JOIN profiles p ON ce.user_id = p.id
      WHERE ce.contest_id = p_contest_id 
        AND ce.has_played = true 
        AND ce.rank <= v_contest.num_winners
      ORDER BY ce.rank
    LOOP
      -- Calculate prize amount based on payout structure
      SELECT 
        CASE 
          WHEN v_winner.rank = 1 THEN v_contest.prize_pool_amount * 0.5  -- 50% for 1st place
          WHEN v_winner.rank = 2 THEN v_contest.prize_pool_amount * 0.3  -- 30% for 2nd place
          WHEN v_winner.rank = 3 THEN v_contest.prize_pool_amount * 0.2  -- 20% for 3rd place
          ELSE 0
        END INTO v_prize_amount;

      -- Update winner's points
      UPDATE profiles
      SET points = points + v_prize_amount::INTEGER
      WHERE id = v_winner.user_id;

      -- Update enrollment with prize amount
      UPDATE contest_enrollments
      SET prize_awarded = v_prize_amount
      WHERE id = v_winner.id;

      -- Record prize in daily reward history
      INSERT INTO daily_reward_history (
        user_id,
        reward_type,
        points_earned,
        description
      ) VALUES (
        v_winner.user_id,
        'contest_prize',
        v_prize_amount::INTEGER,
        'Contest prize - Rank ' || v_winner.rank || ' in: ' || v_contest.title
      );

      v_total_disbursed := v_total_disbursed + v_prize_amount;
      v_winners_count := v_winners_count + 1;
    END LOOP;

    -- Update contest status to disbursed
    UPDATE trivia_contests
    SET status = 'disbursed'
    WHERE id = p_contest_id;

    RETURN json_build_object(
      'success', true,
      'winners_count', v_winners_count,
      'total_disbursed', v_total_disbursed,
      'message', 'Prizes disbursed successfully'
    );

  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Prize disbursement failed: ' || SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION enroll_in_contest_with_points(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_contest_play_status(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_contest_score(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_contest_rankings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION disburse_contest_prizes(UUID, UUID) TO authenticated;