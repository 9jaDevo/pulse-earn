import { createClient } from 'npm:@supabase/supabase-js@2';

interface RequestPayload {
  user_id: string;
  contest_id: string;
  payment_method_type: 'stripe' | 'paystack';
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, contest_id, payment_method_type }: RequestPayload = await req.json();

    // Validate input
    if (!user_id || !contest_id || !payment_method_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get contest details
    const { data: contest, error: contestError } = await supabase
      .from('trivia_contests')
      .select('*')
      .eq('id', contest_id)
      .single();

    if (contestError || !contest) {
      return new Response(
        JSON.stringify({ error: "Contest not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if contest is in enrolling status
    if (contest.status !== 'enrolling' && contest.status !== 'upcoming') {
      return new Response(
        JSON.stringify({ error: "Contest enrollment is not available" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is already enrolled
    const { data: existingEnrollment } = await supabase
      .from('contest_enrollments')
      .select('id')
      .eq('contest_id', contest_id)
      .eq('user_id', user_id)
      .single();

    if (existingEnrollment) {
      return new Response(
        JSON.stringify({ error: "User already enrolled in this contest" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create pending transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id,
        amount: contest.entry_fee,
        currency: contest.prize_pool_currency || 'USD',
        status: 'pending',
        transaction_type: 'contest_entry',
        description: `Contest entry fee for: ${contest.title}`
      })
      .select()
      .single();

    if (transactionError || !transaction) {
      return new Response(
        JSON.stringify({ error: "Failed to create transaction" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create enrollment record
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('contest_enrollments')
      .insert({
        contest_id,
        user_id,
        payment_status: 'pending',
        transaction_id: transaction.id
      })
      .select()
      .single();

    if (enrollmentError || !enrollment) {
      return new Response(
        JSON.stringify({ error: "Failed to create enrollment" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let paymentResponse;

    if (payment_method_type === 'stripe') {
      // Initialize Stripe payment
      const stripe = await import('npm:stripe@14.21.0');
      const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY') || '', {
        apiVersion: '2023-10-16',
      });

      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(contest.entry_fee * 100), // Convert to cents
        currency: contest.prize_pool_currency?.toLowerCase() || 'usd',
        metadata: {
          transaction_id: transaction.id,
          contest_id,
          user_id,
          enrollment_id: enrollment.id
        }
      });

      paymentResponse = {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      };

    } else if (payment_method_type === 'paystack') {
      // Initialize Paystack payment
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `user_${user_id}@pollpeak.com`, // You might want to get actual email
          amount: contest.entry_fee * 100, // Convert to kobo
          currency: contest.prize_pool_currency || 'USD',
          metadata: {
            transaction_id: transaction.id,
            contest_id,
            user_id,
            enrollment_id: enrollment.id
          }
        })
      });

      const paystackData = await paystackResponse.json();
      
      if (!paystackData.status) {
        throw new Error('Paystack initialization failed');
      }

      paymentResponse = {
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transaction.id,
        enrollment_id: enrollment.id,
        payment_data: paymentResponse
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Error in initiate-contest-entry-payment:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});