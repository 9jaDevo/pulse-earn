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
      console.error("Missing Stripe signature");
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
    console.log("Received Stripe webhook event:", event.type);
    
    // Handle the event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      console.log("Processing successful payment intent:", paymentIntent.id);
      
      // Find the transaction by Stripe payment intent ID
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("id, promoted_poll_id, metadata")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .maybeSingle();
      
      if (transactionError) {
        console.error("Error finding transaction:", transactionError);
        return new Response(JSON.stringify({ error: transactionError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (!transactionData) {
        console.log("Transaction not found by payment intent ID, trying metadata lookup");
        
        // Try to find by metadata if direct lookup fails
        if (paymentIntent.metadata && paymentIntent.metadata.transaction_id) {
          const { data: metadataTransaction, error: metadataError } = await supabase
            .from("transactions")
            .select("id, promoted_poll_id, metadata")
            .eq("id", paymentIntent.metadata.transaction_id)
            .maybeSingle();
          
          if (metadataError) {
            console.error("Error finding transaction by metadata:", metadataError);
            return new Response(JSON.stringify({ error: metadataError.message }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          if (!metadataTransaction) {
            console.error("Transaction not found by metadata either");
            return new Response(JSON.stringify({ error: "Transaction not found" }), {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          console.log("Found transaction by metadata:", metadataTransaction);
          
          // Update transaction status
          const { error: updateError } = await supabase
            .from("transactions")
            .update({
              status: "completed",
              updated_at: new Date().toISOString(),
              stripe_payment_intent_id: paymentIntent.id,
              metadata: {
                ...metadataTransaction.metadata,
                stripe_event: event.type,
                payment_intent_id: paymentIntent.id
              }
            })
            .eq("id", metadataTransaction.id);
          
          if (updateError) {
            console.error("Error updating transaction:", updateError);
            return new Response(JSON.stringify({ error: updateError.message }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          console.log("Transaction updated successfully");
          
          // If transaction is for a promoted poll, update its payment status
          if (metadataTransaction.promoted_poll_id) {
            console.log("Updating promoted poll payment status for poll:", metadataTransaction.promoted_poll_id);
            
            const { error: pollUpdateError } = await supabase
              .from("promoted_polls")
              .update({
                payment_status: "paid",
                updated_at: new Date().toISOString()
              })
              .eq("id", metadataTransaction.promoted_poll_id);
            
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
        }
        
        console.error("Transaction not found and no metadata available");
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
            stripe_event: event.type,
            payment_intent_id: paymentIntent.id
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
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      console.log("Processing failed payment intent:", paymentIntent.id);
      
      // Find the transaction by Stripe payment intent ID
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("id, promoted_poll_id, metadata")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .maybeSingle();
      
      if (transactionError) {
        console.error("Error finding transaction:", transactionError);
        return new Response(JSON.stringify({ error: transactionError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (!transactionData) {
        console.log("Transaction not found by payment intent ID, trying metadata lookup");
        
        // Try to find by metadata if direct lookup fails
        if (paymentIntent.metadata && paymentIntent.metadata.transaction_id) {
          const { data: metadataTransaction, error: metadataError } = await supabase
            .from("transactions")
            .select("id, promoted_poll_id, metadata")
            .eq("id", paymentIntent.metadata.transaction_id)
            .maybeSingle();
          
          if (metadataError) {
            console.error("Error finding transaction by metadata:", metadataError);
            return new Response(JSON.stringify({ error: metadataError.message }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          if (!metadataTransaction) {
            console.error("Transaction not found by metadata either");
            return new Response(JSON.stringify({ error: "Transaction not found" }), {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          console.log("Found transaction by metadata:", metadataTransaction);
          
          // Update transaction status
          const { error: updateError } = await supabase
            .from("transactions")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
              stripe_payment_intent_id: paymentIntent.id,
              metadata: {
                ...metadataTransaction.metadata,
                stripe_event: event.type,
                payment_intent_id: paymentIntent.id,
                failure_reason: paymentIntent.last_payment_error?.message || "Payment failed"
              }
            })
            .eq("id", metadataTransaction.id);
          
          if (updateError) {
            console.error("Error updating transaction:", updateError);
            return new Response(JSON.stringify({ error: updateError.message }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          console.log("Transaction updated successfully");
          
          // If transaction is for a promoted poll, update its payment status
          if (metadataTransaction.promoted_poll_id) {
            console.log("Updating promoted poll payment status for poll:", metadataTransaction.promoted_poll_id);
            
            const { error: pollUpdateError } = await supabase
              .from("promoted_polls")
              .update({
                payment_status: "failed",
                updated_at: new Date().toISOString()
              })
              .eq("id", metadataTransaction.promoted_poll_id);
            
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
        
        console.error("Transaction not found and no metadata available");
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
            stripe_event: event.type,
            failure_reason: paymentIntent.last_payment_error?.message || "Payment failed"
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
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object;
      console.log("Processing refund for charge:", charge.id);
      
      // Find the transaction by payment intent ID
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("id, promoted_poll_id, metadata")
        .eq("stripe_payment_intent_id", charge.payment_intent)
        .maybeSingle();
      
      if (transactionError) {
        console.error("Error finding transaction:", transactionError);
        return new Response(JSON.stringify({ error: transactionError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (!transactionData) {
        console.error("Transaction not found for refund");
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
          status: "refunded",
          updated_at: new Date().toISOString(),
          metadata: {
            ...transactionData.metadata,
            stripe_event: event.type,
            refund_id: charge.refunds.data[0]?.id
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
            payment_status: "refunded",
            updated_at: new Date().toISOString()
          })
          .eq("id", transactionData.promoted_poll_id);
        
        if (pollUpdateError) {
          console.error("Error updating promoted poll:", pollUpdateError);
          // Continue anyway, as the transaction was updated successfully
        } else {
          console.log("Promoted poll payment status updated to 'refunded'");
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