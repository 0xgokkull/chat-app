import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { group_id } = await req.json();

    if (!group_id) {
      return new Response("Missing group_id", { status: 400, headers: corsHeaders });
    }

    // Fetch all pending actions for the group
    const { data: actions, error: actionsError } = await supabase
      .from('action_requests')
      .select(`
        title, 
        description, 
        state,
        assignee:assigned_user_id(display_name, email)
      `)
      .eq('group_id', group_id)
      .eq('state', 'pending');

    if (actionsError) throw actionsError;

    if (!actions || actions.length === 0) {
      return new Response("No pending actions", { status: 200, headers: corsHeaders });
    }

    // Format the actions into a string for the AI
    const actionListText = actions.map(a => 
      `- ${a.title} (Assigned to: ${a.assignee?.display_name || a.assignee?.email || 'Unknown'})`
    ).join('\n');

    // Call Groq API to generate a motivational, highly readable recap
    const prompt = `
      You are an elite, highly professional AI project manager. 
      Generate a short, punchy "Daily Priority Recap" for a team workspace based on the following pending tasks:
      
      ${actionListText}
      
      Your response should be directly readable by the team in a chat interface. 
      Keep it energetic, use emojis, and structure it clearly so everyone knows exactly what they need to work on today.
      Do not output any JSON, just the final formatted text.
    `;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b", // Use a model available to this API key
        messages: [{ role: "user", content: prompt }]
      })
    });

    const groqData = await groqRes.json();
    const recapText = groqData.choices[0].message.content;

    // Insert the AI recap back into the group chat as a system message
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        group_id: group_id,
        body: recapText,
        message_type: 'ai_notice'
      });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, message: "Recap generated" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
