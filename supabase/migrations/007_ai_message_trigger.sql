-- 007_ai_message_trigger.sql

-- This creates a Postgres Trigger that automatically calls our deployed Edge Function
-- whenever a new message is inserted into the 'messages' table.

create trigger "ai_message_analysis_trigger"
after insert on public.messages
for each row
execute function supabase_functions.http_request(
  'https://oqgpyawpqrupgxjznqdg.supabase.co/functions/v1/analyze-message',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);
