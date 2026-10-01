import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

const SYSTEM_PROMPT = `You are an intelligent assistant integrated into a group chat. 
Your job is to analyze the conversation and determine if a user is asking for a work status update, creating a task, or requesting a recipe/checklist.

You MUST reply with valid JSON matching exactly this schema:
{
  "should_create_action": boolean,
  "intent": "work_status_request" | "recipe_request" | "question" | "task_request",
  "confidence": number (0.0 to 1.0),
  "requester_user_id": string (the ID of the person making the request),
  "assignee_user_id": string (the ID of the person assigned to the task, if any),
  "title": string (short title of the action),
  "description": string (details of the request),
  "priority": "low" | "medium" | "high"
}`;

serve(async (req) => {
  // We use the service role key to bypass RLS since this is a backend worker
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // 1. Fetch queued jobs
    const { data: jobs, error: fetchError } = await supabaseClient
      .from('ai_analysis_jobs')
      .select('*')
      .eq('status', 'queued')
      .limit(5);

    if (fetchError) throw fetchError;
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No jobs queued" }), { headers: { "Content-Type": "application/json" } });
    }

    // 2. Process each job
    for (const job of jobs) {
      // Mark as processing
      await supabaseClient.from('ai_analysis_jobs').update({ status: 'processing', attempts: job.attempts + 1 }).eq('id', job.id);

      // Fetch the source message
      const { data: sourceMessage } = await supabaseClient
        .from('messages')
        .select('*')
        .eq('id', job.message_id)
        .single();

      // Fetch group context (last 10 messages)
      const { data: recentMessages } = await supabaseClient
        .from('messages')
        .select('*, profiles(display_name, email)')
        .eq('group_id', job.group_id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch group members
      const { data: members } = await supabaseClient
        .from('group_members')
        .select('*, profiles(display_name, email)')
        .eq('group_id', job.group_id);

      if (!sourceMessage || !recentMessages || !members) continue;

      // Construct context string
      const membersContext = members.map(m => `- ${m.profiles?.display_name || m.profiles?.email} (ID: ${m.user_id})`).join('\n');
      const conversationContext = recentMessages.reverse().map(m => `${m.profiles?.display_name || m.profiles?.email}: "${m.body}"`).join('\n');

      const promptContext = `
Group members:
${membersContext}

Recent conversation:
${conversationContext}

Current message to analyze:
"${sourceMessage.body}"
      `;

      // 3. Call Groq API with Structured Outputs (JSON Schema)
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192", // Fast and capable model
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: promptContext }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        })
      });

      const groqData = await response.json();
      const rawJson = groqData.choices[0].message.content;
      const parsedOutput = JSON.parse(rawJson); // Normally we'd validate against Zod schema here

      // 4. Save analysis results
      await supabaseClient.from('ai_message_analysis').insert([{
        message_id: sourceMessage.id,
        intent: parsedOutput.intent || 'question',
        confidence_score: parsedOutput.confidence || 0.8,
        extracted_json: parsedOutput,
        priority_score: parsedOutput.priority || 'low',
        model_name: "llama3-8b-8192",
        prompt_version: "1.0"
      }]);

      // 5. If confidence is high and action requested, create action request
      if (parsedOutput.should_create_action && parsedOutput.confidence > 0.8) {
        await supabaseClient.from('action_requests').insert([{
          group_id: job.group_id,
          source_message_id: sourceMessage.id,
          created_by: sourceMessage.sender_id,
          assigned_user_id: parsedOutput.assignee_user_id,
          action_type: parsedOutput.intent === 'work_status_request' ? 'status_check' : 'checklist',
          title: parsedOutput.title || 'Action Required',
          description: parsedOutput.description || ''
        }]);

        // Integrate Resend API: Email the assignee instantly!
        const assignee = members.find(m => m.user_id === parsedOutput.assignee_user_id);
        const assigneeEmail = assignee?.profiles?.email;
        const RESEND_API_KEY = Deno.env.get("RESEND_API");

        if (assigneeEmail && RESEND_API_KEY) {
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                from: "AI Chat Assistant <onboarding@resend.dev>",
                to: [assigneeEmail],
                subject: `New Task Assigned: ${parsedOutput.title}`,
                html: `
                  <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #4f46e5;">New AI Action Request</h2>
                    <p>You have been assigned a new task in the group chat.</p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 10px;">
                      <strong>${parsedOutput.title}</strong><br/>
                      ${parsedOutput.description}
                    </div>
                    <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">This is an automated message from your AI Chat App.</p>
                  </div>
                `
              })
            });
          } catch (emailError) {
            console.error("Failed to send Resend email:", emailError);
          }
        }
      }

      // Mark job as completed
      await supabaseClient.from('ai_analysis_jobs').update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      }).eq('id', job.id);
    }

    return new Response(JSON.stringify({ processed: jobs.length }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
