// Follow Deno's ES modules approach
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import * as crypto from "https://deno.land/std@0.168.0/crypto/mod.ts";

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
    const body = await req.text();
    
    // Get the Paystack signature from the request headers
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      console.error("Missing Paystack signature");
      return new Response(JSON.stringify({ error: "Missing Paystack signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the signature
    // Convert the secret key to a Uint8Array
    const encoder = new TextEncoder();
    const secretKeyBytes = encoder.encode(PAYSTACK_SECRET_KEY);
    
    // Create a key object from the secret key
    const key = await crypto.subtle.importKey(
      "raw",
      secretKeyBytes,
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign", "verify"]
    );
    
    // Sign the request body
    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(body)
    );
    
    // Convert the signature to a hex string
    const signatureHex = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    
    // Compare the computed signature with the one from the request
    if (signatureHex !== signature) {
      console.error("Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Parse the event data
    const event = JSON.parse(body);
    console.log("Received Paystack webhook event:", event.event);
    
    // Handle the event
    if (event.event === "charge.success") {
      const transaction = event.data;
      const reference = transaction.reference;
      console.log("Processing successful charge with reference:", reference);
      
      // Find the transaction by Paystack reference
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("id, promoted_poll_id, metadata")
        .eq("gateway_transaction_id", reference)
        .maybeSingle();
      
      if (transactionError) {
        console.error("Error finding transaction:", transactionError);
        return new Response(JSON.stringify({ error: transactionError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (!transactionData) {
        console.error("Transaction not found with reference:", reference);
        return new Response(JSON.stringify({ error: "Transaction not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.log("Found transaction:", transactionData);
      
      // Update transaction status
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
          metadata: {
            ...transactionData.metadata,
            paystack_event: event.event,
            paystack_transaction_id: transaction.id
          }
        })
        .eq("id", transactionData.id);
      
      if (updateError) {
        console.error("Error updating transaction:", updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.log("Transaction updated successfully");
      
      // If transaction is for a promoted poll, update its payment status
      if (transactionData.promoted_poll_id) {
        console.log("Updating promoted poll payment status for poll:", transactionData.promoted_poll_id);
        
        const { error: pollUpdateError } = await supabase
          .from("promoted_polls")
          .update({
            payment_status: "paid",
            updated_at: new Date().toISOString()
          })
          .eq("id", transactionData.promoted_poll_id);
        
        if (pollUpdateError) {
          console.error("Error updating promoted poll:", pollUpdateError);
          // Continue anyway, as the transaction was updated successfully
        } else {
          console.log("Promoted poll payment status updated to 'paid'");
        }
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (event.event === "charge.failed") {
      const transaction = event.data;
      const reference = transaction.reference;
      console.log("Processing failed charge with reference:", reference);
      
      // Find the transaction by Paystack reference
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("id, promoted_poll_id, metadata")
        .eq("gateway_transaction_id", reference)
        .maybeSingle();
      
      if (transactionError) {
        console.error("Error finding transaction:", transactionError);
        return new Response(JSON.stringify({ error: transactionError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (!transactionData) {
        console.error("Transaction not found with reference:", reference);
        return new Response(JSON.stringify({ error: "Transaction not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.log("Found transaction:", transactionData);
      
      // Update transaction status
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
          metadata: {
            ...transactionData.metadata,
            paystack_event: event.event,
            failure_reason: transaction.gateway_response
          }
        })
        .eq("id", transactionData.id);
      
      if (updateError) {
        console.error("Error updating transaction:", updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.log("Transaction updated successfully");
      
      // If transaction is for a promoted poll, update its payment status
      if (transactionData.promoted_poll_id) {
        console.log("Updating promoted poll payment status for poll:", transactionData.promoted_poll_id);
        
        const { error: pollUpdateError } = await supabase
          .from("promoted_polls")
          .update({
            payment_status: "failed",
            updated_at: new Date().toISOString()
          })
          .eq("id", transactionData.promoted_poll_id);
        
        if (pollUpdateError) {
          console.error("Error updating promoted poll:", pollUpdateError);
          // Continue anyway, as the transaction was updated successfully
        } else {
          console.log("Promoted poll payment status updated to 'failed'");
        }
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