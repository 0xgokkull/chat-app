-- 006_enable_realtime.sql

-- Enable Supabase Realtime for specific tables by adding them to the publication.
-- If they are not added, Postgres will not broadcast INSERT/UPDATE/DELETE events to WebSockets.

begin;
  -- Remove them first just in case to avoid errors, then add them.
  -- Supabase has a default publication called supabase_realtime
  alter publication supabase_realtime add table public.messages;
  alter publication supabase_realtime add table public.action_requests;
  alter publication supabase_realtime add table public.action_responses;
  alter publication supabase_realtime add table public.connections;
commit;
