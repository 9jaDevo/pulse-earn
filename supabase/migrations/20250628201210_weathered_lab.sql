-- Add Stripe-specific fields to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_method_id text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Create index for Stripe payment intent ID
CREATE INDEX IF NOT EXISTS transactions_stripe_payment_intent_id_idx ON transactions(stripe_payment_intent_id);

-- Add Stripe configuration to payment_methods table
UPDATE payment_methods
SET config = jsonb_build_object(
  'payment_method_types', ARRAY['card'],
  'currency', 'usd',
  'capture_method', 'automatic',
  'statement_descriptor', 'PULSELEARN',
  'statement_descriptor_suffix', 'POLL'
)
WHERE type = 'stripe'
AND (config IS NULL OR config = '{}'::jsonb);

-- Add function to handle Stripe webhook events
CREATE OR REPLACE FUNCTION handle_stripe_webhook_event(
  p_event_type text,
  p_payment_intent_id text,
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
  -- Find the transaction by payment intent ID
  SELECT id, promoted_poll_id INTO v_transaction_id, v_promoted_poll_id
  FROM transactions
  WHERE stripe_payment_intent_id = p_payment_intent_id;
  
  -- If transaction not found, return false
  IF v_transaction_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update transaction status based on payment status
  IF p_payment_status = 'succeeded' THEN
    UPDATE transactions
    SET 
      status = 'completed',
      updated_at = now(),
      metadata = jsonb_build_object('stripe_event', p_event_type)
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
      metadata = jsonb_build_object('stripe_event', p_event_type, 'failure_reason', p_metadata->'last_payment_error'->>'message')
    WHERE id = v_transaction_id;
  ELSIF p_payment_status = 'refunded' THEN
    UPDATE transactions
    SET 
      status = 'refunded',
      updated_at = now(),
      metadata = jsonb_build_object('stripe_event', p_event_type)
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
GRANT EXECUTE ON FUNCTION handle_stripe_webhook_event(text, text, text, jsonb) TO service_role;