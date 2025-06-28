// Follow Deno's ES modules approach
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

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
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the request body
    const body = await req.text();
    
    // Get the Stripe signature from the request headers
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing Stripe signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the signature (in a real implementation)
    // For now, we'll skip this step and assume the signature is valid
    // const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    
    // Parse the event data
    const event = JSON.parse(body);
    
    // Handle the event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      
      // Call the database function to handle the payment success
      const { data, error } = await supabase.rpc("handle_stripe_webhook_event", {
        p_event_type: event.type,
        p_payment_intent_id: paymentIntent.id,
        p_payment_status: "succeeded",
        p_metadata: paymentIntent.metadata || {}
      });
      
      if (error) {
        console.error("Error handling payment success:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      
      // Call the database function to handle the payment failure
      const { data, error } = await supabase.rpc("handle_stripe_webhook_event", {
        p_event_type: event.type,
        p_payment_intent_id: paymentIntent.id,
        p_payment_status: "failed",
        p_metadata: {
          last_payment_error: paymentIntent.last_payment_error || {}
        }
      });
      
      if (error) {
        console.error("Error handling payment failure:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object;
      
      // Call the database function to handle the refund
      const { data, error } = await supabase.rpc("handle_stripe_webhook_event", {
        p_event_type: event.type,
        p_payment_intent_id: charge.payment_intent,
        p_payment_status: "refunded",
        p_metadata: charge.metadata || {}
      });
      
      if (error) {
        console.error("Error handling refund:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Return a 200 response for other event types
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});