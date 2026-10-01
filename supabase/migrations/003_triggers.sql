-- 003_triggers.sql

-- Function to queue an AI analysis job whenever a new user message is inserted
create or replace function public.queue_ai_analysis_job()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Only queue jobs for actual user messages, not system or AI messages
  if new.message_type = 'user' then
    insert into public.ai_analysis_jobs (message_id, group_id, status)
    values (new.id, new.group_id, 'queued');
  end if;
  return new;
end;
$$;

-- Trigger on the messages table
drop trigger if exists on_new_message_queue_ai on public.messages;
create trigger on_new_message_queue_ai
  after insert on public.messages
  for each row
  execute function public.queue_ai_analysis_job();
