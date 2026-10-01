import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqgpyawpqrupgxjznqdg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZ3B5YXdwcXJ1cGd4anpucWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NDkyMDYsImV4cCI6MjEwNjQyNTIwNn0.2PPYM_FUxHSs8PTL1YEfxd65q9HvVymCRq9gnudLuio';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("🚀 Starting end-to-end AI Pipeline Test...\n");
  
  // 1. Sign up a dummy user to simulate a chat user
  const email = `testuser3939@gmail.com`;
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: 'password123'
  });
  if (authError) {
    console.error("❌ Auth Error:", authError.message);
    return;
  }
  const userId = authData.user.id;
  console.log(`✅ Dummy user created: ${email}`);

  // 2. Create a chat group
  const { data: group, error: groupError } = await supabase.from('groups').insert([{
    name: 'Test Engineering Team',
    created_by: userId
  }]).select().single();
  if (groupError) {
    console.error("❌ Group Error:", groupError.message);
    return;
  }
  console.log(`✅ Group created: Test Engineering Team`);

  // 3. Make the user an owner of the group
  await supabase.from('group_members').insert([{
    group_id: group.id,
    user_id: userId,
    role: 'owner'
  }]);

  // 4. Send a message that should trigger the AI to extract an intent
  const testMessage = "@Arun, did you finish the Realtime integration?";
  console.log(`\n💬 Sending chat message: "${testMessage}"`);
  
  const { data: message, error: msgError } = await supabase.from('messages').insert([{
    group_id: group.id,
    sender_id: userId,
    body: testMessage
  }]).select().single();
  if (msgError) {
    console.error("❌ Message Error:", msgError.message);
    return;
  }
  console.log(`✅ Message inserted into database. (Trigger should have queued a job)`);

  // Wait a moment to ensure trigger completes
  await new Promise(r => setTimeout(r, 1000));

  // 5. Check if the job was queued
  const { data: jobs } = await supabase.from('ai_analysis_jobs').select('*').eq('message_id', message.id);
  console.log(`✅ Found ${jobs?.length} jobs in ai_analysis_jobs queue.`);

  // 6. Invoke the Edge Function to process the queue
  console.log("\n⚡ Invoking Edge Function (process-ai-jobs) to connect to Groq AI...");
  const { data: funcData, error: funcError } = await supabase.functions.invoke('process-ai-jobs');
  
  if (funcError) {
    console.error("❌ Edge Function Error:", funcError);
    return;
  }
  console.log("✅ Edge Function Response:", funcData);

  // 7. Verify the AI created an action request based on the message
  const { data: actions, error: actError } = await supabase.from('action_requests').select('*').eq('source_message_id', message.id);
  
  console.log("\n🔍 Verification Check in 'action_requests' table:");
  if (actions && actions.length > 0) {
    console.log("🎉 SUCCESS! The AI understood the message and successfully generated an Action Request:");
    console.log(JSON.stringify(actions, null, 2));
  } else {
    console.log("⚠️ No action requests were created by the AI. It might have had low confidence or rejected the prompt.");
  }
}

run();
