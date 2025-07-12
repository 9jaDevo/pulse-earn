import { createClient } from 'npm:@supabase/supabase-js@2';

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date().toISOString();

    // Update contests from 'upcoming' to 'enrolling' (when enrollment should start)
    // Assuming enrollment starts 24 hours before contest start
    await supabase
      .from('trivia_contests')
      .update({ status: 'enrolling' })
      .eq('status', 'upcoming')
      .lt('start_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());

    // Update contests from 'enrolling' to 'active' (when contest starts)
    await supabase
      .from('trivia_contests')
      .update({ status: 'active' })
      .eq('status', 'enrolling')
      .lte('start_time', now);

    // Update contests from 'active' to 'ended' (when contest ends)
    await supabase
      .from('trivia_contests')
      .update({ status: 'ended' })
      .eq('status', 'active')
      .lte('end_time', now);

    return new Response(
      JSON.stringify({ success: true, message: "Contest statuses updated" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Error updating contest status:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});