-- Create function to handle Paystack webhook events
CREATE OR REPLACE FUNCTION handle_paystack_webhook_event(
  p_event_type text,
  p_reference text,
  p_payment_status text,
  p_metadata jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id uuid;
  v_promoted_poll_id uuid;
BEGIN
  -- Find the transaction by Paystack reference
  SELECT id, promoted_poll_id INTO v_transaction_id, v_promoted_poll_id
  FROM transactions
  WHERE gateway_transaction_id = p_reference;
  
  -- If transaction not found, return false
  IF v_transaction_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update transaction status based on payment status
  IF p_payment_status = 'success' THEN
    UPDATE transactions
    SET 
      status = 'completed',
      updated_at = now(),
      metadata = jsonb_build_object('paystack_event', p_event_type)
    WHERE id = v_transaction_id;
    
    -- If transaction is for a promoted poll, update its payment status
    IF v_promoted_poll_id IS NOT NULL THEN
      UPDATE promoted_polls
      SET 
        payment_status = 'paid',
        updated_at = now()
      WHERE id = v_promoted_poll_id;
    END IF;
  ELSIF p_payment_status = 'failed' THEN
    UPDATE transactions
    SET 
      status = 'failed',
      updated_at = now(),
      metadata = jsonb_build_object('paystack_event', p_event_type, 'failure_reason', p_metadata->>'gateway_response')
    WHERE id = v_transaction_id;
  ELSIF p_payment_status = 'refunded' THEN
    UPDATE transactions
    SET 
      status = 'refunded',
      updated_at = now(),
      metadata = jsonb_build_object('paystack_event', p_event_type)
    WHERE id = v_transaction_id;
    
    -- If transaction is for a promoted poll, update its payment status
    IF v_promoted_poll_id IS NOT NULL THEN
      UPDATE promoted_polls
      SET 
        payment_status = 'refunded',
        updated_at = now()
      WHERE id = v_promoted_poll_id;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION handle_paystack_webhook_event(text, text, text, jsonb) TO service_role;