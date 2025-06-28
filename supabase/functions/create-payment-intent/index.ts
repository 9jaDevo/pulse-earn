// Follow Deno's ES modules approach
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import Stripe from "npm:stripe@12.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    // Get the request body
    const { amount, userId, transactionId, promotedPollId } = await req.json();
    
    if (!amount || !userId || !transactionId) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Get user profile for customer information
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("id", userId)
      .single();
    
    if (profileError) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Create or retrieve Stripe customer
    let customerId;
    const { data: existingCustomer } = await supabase
      .from("transactions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id;
    } else {
      // Create a new customer
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.name || undefined,
        metadata: {
          user_id: userId
        }
      });
      
      customerId = customer.id;
    }
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      customer: customerId,
      metadata: {
        user_id: userId,
        transaction_id: transactionId,
        promoted_poll_id: promotedPollId || ""
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    // Update the transaction with Stripe-specific information
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: customerId,
        metadata: {
          ...paymentIntent.metadata,
          client_secret: paymentIntent.client_secret
        }
      })
      .eq("id", transactionId);
    
    if (updateError) {
      console.error("Error updating transaction:", updateError);
      // Continue anyway, as the payment intent was created successfully
    }
    
    // Return the client secret
    return new Response(JSON.stringify({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});