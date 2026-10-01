-- 002_rls.sql

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.messages enable row level security;
alter table public.ai_analysis_jobs enable row level security;
alter table public.ai_message_analysis enable row level security;
alter table public.action_requests enable row level security;
alter table public.action_responses enable row level security;
alter table public.checklist_items enable row level security;
alter table public.evidence_items enable row level security;
alter table public.audit_events enable row level security;

-- Profiles
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Groups
create or replace function public.is_member_of(target_group_id uuid)
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group_id and user_id = auth.uid()
  );
$$;

drop policy if exists "Users can view groups they are members of" on public.groups;
create policy "Users can view groups they are members of" on public.groups
  for select using (
    public.is_member_of(id)
  );

drop policy if exists "Authenticated users can create groups" on public.groups;
create policy "Authenticated users can create groups" on public.groups
  for insert with check (auth.role() = 'authenticated');

-- Group Members
drop policy if exists "Users can view members of their groups" on public.group_members;
create policy "Users can view members of their groups" on public.group_members
  for select using (
    public.is_member_of(group_id)
  );

drop policy if exists "Users can join groups" on public.group_members;
create policy "Users can join groups" on public.group_members
  for insert with check (auth.role() = 'authenticated');

-- Messages
drop policy if exists "Users can view messages in their groups" on public.messages;
create policy "Users can view messages in their groups" on public.messages
  for select using (
    public.is_member_of(group_id)
  );

drop policy if exists "Users can insert messages in their groups" on public.messages;
create policy "Users can insert messages in their groups" on public.messages
  for insert with check (
    sender_id = auth.uid() and
    public.is_member_of(group_id)
  );

-- Action Requests
drop policy if exists "Users can view action requests in their groups" on public.action_requests;
create policy "Users can view action requests in their groups" on public.action_requests
  for select using (
    public.is_member_of(group_id)
  );

drop policy if exists "Only action requester or group admin can update action state" on public.action_requests;
create policy "Only action requester or group admin can update action state" on public.action_requests
  for update using (
    created_by = auth.uid() or
    exists (
      select 1 from public.group_members
      where group_id = public.action_requests.group_id and user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

-- Action Responses
drop policy if exists "Users can view responses for actions in their groups" on public.action_responses;
create policy "Users can view responses for actions in their groups" on public.action_responses
  for select using (
    exists (
      select 1 from public.action_requests ar
      where ar.id = public.action_responses.action_request_id and public.is_member_of(ar.group_id)
    )
  );

drop policy if exists "Only assigned user can submit an action response" on public.action_responses;
create policy "Only assigned user can submit an action response" on public.action_responses
  for insert with check (
    responder_id = auth.uid() and
    exists (
      select 1 from public.action_requests
      where id = action_request_id and assigned_user_id = auth.uid()
    )
  );

drop policy if exists "Users cannot modify another person's response" on public.action_responses;
create policy "Users cannot modify another person's response" on public.action_responses
  for update using (responder_id = auth.uid());

-- Evidence Items
drop policy if exists "Users can view evidence in their groups" on public.evidence_items;
create policy "Users can view evidence in their groups" on public.evidence_items
  for select using (
    exists (
      select 1 from public.action_responses resp
      join public.action_requests ar on ar.id = resp.action_request_id
      where resp.id = public.evidence_items.action_response_id and public.is_member_of(ar.group_id)
    )
  );

drop policy if exists "Users can submit their own evidence" on public.evidence_items;
create policy "Users can submit their own evidence" on public.evidence_items
  for insert with check (submitted_by = auth.uid());

-- Prevent Edge Functions/Server side logic from being manipulated on client
-- The AI Jobs and Analysis tables shouldn't be directly modifiable by clients
drop policy if exists "AI tables are read-only for clients" on public.ai_analysis_jobs;
create policy "AI tables are read-only for clients" on public.ai_analysis_jobs
  for select using (
    public.is_member_of(group_id)
  );
