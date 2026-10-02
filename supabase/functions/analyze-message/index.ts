import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const { record } = await req.json(); // The inserted message from the webhook

    if (!record || !record.body) {
      return new Response("No message body", { status: 400 });
    }

    if (record.message_type !== 'user') {
      return new Response("Not a user message", { status: 200 });
    }

    // Call Groq API to analyze intent
    const prompt = `
      You are an AI assistant analyzing chat messages in a project workspace.
      Determine if the user is explicitly asking for a summary, recap, or list of pending tasks/actions in the group. If so, output intent="recap_request".
      Determine if the message contains a list of requirements, tasks, or ingredients that should be tracked as a checklist. If so, output intent="checklist" and items=[{label, category}]. Categories can be: requirement, ingredient, proof, step.
      If it is just casual conversation, output intent="none".
      
      Message: "${record.body}"
      
      Respond strictly in JSON format:
      {
        "intent": "checklist" | "recap_request" | "none",
        "items": [
          { "label": "string", "category": "requirement|ingredient|proof|step" }
        ] // items can be empty if intent is not checklist
      }
    `;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b", // Use a model available to this API key
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    const groqData = await groqRes.json();
    
    if (!groqRes.ok) {
      console.error("Groq API Error:", groqData);
      throw new Error(`Groq API returned an error: ${groqData.error?.message || JSON.stringify(groqData)}`);
    }

    if (!groqData.choices || !groqData.choices[0]) {
      console.error("Unexpected Groq response:", groqData);
      throw new Error("Groq API response did not contain choices");
    }

    const analysis = JSON.parse(groqData.choices[0].message.content);

    if (analysis.intent === "checklist" && analysis.items && analysis.items.length > 0) {
      // 1. Create an Action Request for the checklist
      const { data: actionRequest, error: arError } = await supabase
        .from('action_requests')
        .insert({
          group_id: record.group_id,
          source_message_id: record.id,
          created_by: record.sender_id,
          action_type: 'checklist',
          title: 'Generated Checklist',
          state: 'pending'
        })
        .select('id')
        .single();

      if (arError) throw arError;

      // 2. Insert the checklist items
      const itemsToInsert = analysis.items.map((item: any) => ({
        action_request_id: actionRequest.id,
        label: item.label,
        category: item.category,
        state: 'unchecked'
      }));

      const { error: itemsError } = await supabase
        .from('checklist_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    } else if (analysis.intent === "recap_request") {
      // Trigger the recap generation edge function internally
      const recapRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-group-recap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ group_id: record.group_id })
      });
      
      if (!recapRes.ok) {
        console.error("Failed to trigger recap function:", await recapRes.text());
      }
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
