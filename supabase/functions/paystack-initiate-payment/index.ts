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
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") || "";

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    
    // Get frontend URL and ensure it doesn't end with a trailing slash
    let frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";
    if (frontendUrl.endsWith('/')) {
      frontendUrl = frontendUrl.slice(0, -1);
    }
    
    // Make a request to Paystack API to initialize a transaction
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: profile.email,
        amount: Math.round(amount * 100), // Convert to kobo/cents
        callback_url: `${frontendUrl}/dashboard?section=sponsor&payment_status=success&transaction_id=${transactionId}`,
        metadata: {
          user_id: userId,
          transaction_id: transactionId,
          promoted_poll_id: promotedPollId || "",
          custom_fields: [
            {
              display_name: "Transaction Type",
              variable_name: "transaction_type",
              value: "promoted_poll"
            }
          ]
        }
      })
    });
    
    if (!paystackResponse.ok) {
      const errorData = await paystackResponse.json();
      throw new Error(errorData.message || "Failed to initialize Paystack payment");
    }
    
    const paystackData = await paystackResponse.json();
    
    if (!paystackData.status || !paystackData.data || !paystackData.data.authorization_url) {
      throw new Error("Invalid response from Paystack");
    }
    
    // Update the transaction with Paystack reference
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        gateway_transaction_id: paystackData.data.reference,
        metadata: {
          paystack_reference: paystackData.data.reference,
          paystack_access_code: paystackData.data.access_code
        }
      })
      .eq("id", transactionId);
    
    if (updateError) {
      console.error("Error updating transaction:", updateError);
      // Continue anyway, as the payment was initialized successfully
    }
    
    // Return the authorization URL
    return new Response(JSON.stringify({ 
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error initializing Paystack payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});