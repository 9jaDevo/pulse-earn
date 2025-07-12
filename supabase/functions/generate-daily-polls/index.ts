// Follow Deno's ES modules approach
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import OpenAI from "npm:openai@4.28.0";

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
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    // Parse request body
    const { adminId, numPolls = 1, categories = [], topic = "", country = null } = await req.json();

    if (!adminId) {
      return new Response(
        JSON.stringify({ error: "Admin ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify that the user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", adminId)
      .single();

    if (adminError || !adminData || adminData.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Only admins can generate polls" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare the prompt for OpenAI
    let prompt = `Generate ${numPolls} engaging and neutral poll questions`;
    
    if (topic) {
      prompt += ` about ${topic}`;
    }
    
    if (categories && categories.length > 0) {
      prompt += ` in the following categories: ${categories.join(", ")}`;
    }
    
    prompt += `. Each poll should have a title, 2-6 options, and a category.
    
    The polls should be:
    1. Neutral and unbiased
    2. Engaging and thought-provoking
    3. Appropriate for a general audience
    4. Not politically divisive or controversial
    5. Clear and concise
    
    Return the polls in the following JSON format:
    [
      {
        "title": "Poll question here?",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "category": "Category Name"
      }
    ]
    
    Make sure each poll has a different category if multiple categories were provided.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates engaging poll questions. Your responses should be in valid JSON format only, with no additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Parse the response
    const responseContent = completion.choices[0].message.content;
    let pollsData;
    
    try {
      const parsedResponse = JSON.parse(responseContent);
      pollsData = parsedResponse.polls || parsedResponse;
      
      // Ensure pollsData is an array
      if (!Array.isArray(pollsData)) {
        throw new Error("Response is not an array of polls");
      }
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      return new Response(
        JSON.stringify({ error: "Failed to parse OpenAI response", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create polls in the database
    const createdPolls = [];
    const errors = [];

    for (const pollData of pollsData) {
      try {
        // Generate a slug from the title
        const slug = pollData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);
        
        // Transform options to the format expected by the polls table
        const options = pollData.options.map(text => ({
          text,
          votes: 0
        }));

        // Insert the poll
        const { data: poll, error } = await supabase
          .from("polls")
          .insert({
            title: pollData.title,
            description: pollData.description || null,
            options,
            type: country ? "country" : "global",
            country,
            slug,
            created_by: adminId,
            category: pollData.category || "General",
            is_active: true
          })
          .select()
          .single();

        if (error) {
          errors.push({ poll: pollData, error: error.message });
        } else {
          createdPolls.push(poll);
        }
      } catch (error) {
        errors.push({ poll: pollData, error: error.message });
      }
    }

    // Return the results
    return new Response(
      JSON.stringify({
        success: true,
        createdPolls,
        errors,
        totalCreated: createdPolls.length,
        totalErrors: errors.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-daily-polls function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});