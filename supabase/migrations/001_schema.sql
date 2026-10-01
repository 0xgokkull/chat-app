-- 001_schema.sql

-- Drop the old messages table from the previous setup so we can recreate it cleanly
drop table if exists public.messages cascade;

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create type public.group_role as enum ('owner', 'admin', 'member');
create type public.message_type as enum ('user', 'system', 'ai_notice', 'action_result');
create type public.ai_job_status as enum ('queued', 'processing', 'completed', 'failed');
create type public.ai_intent as enum ('work_status', 'recipe_request', 'question', 'task_request');
create type public.action_type as enum ('status_check', 'checklist', 'approval', 'availability');
create type public.action_state as enum ('pending', 'responded', 'expired', 'cancelled', 'reopened');
create type public.response_status as enum ('completed', 'in_progress', 'blocked', 'rejected');
create type public.checklist_category as enum ('requirement', 'ingredient', 'proof', 'step');
create type public.checklist_state as enum ('unchecked', 'confirmed', 'unavailable', 'not_applicable');
create type public.evidence_type as enum ('github_pr', 'deployment_url', 'image', 'document', 'text');
create type public.verification_status as enum ('unverified', 'automated_verified', 'reviewer_verified');

create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_by uuid references public.profiles(id) not null,
  group_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role public.group_role default 'member' not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_read_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, user_id)
);

create table public.messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  sender_id uuid references public.profiles(id),
  body text not null,
  message_type public.message_type default 'user' not null,
  reply_to_id uuid references public.messages(id),
  client_message_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  edited_at timestamp with time zone,
  deleted_at timestamp with time zone
);

create table public.ai_analysis_jobs (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  status public.ai_job_status default 'queued' not null,
  attempts int default 0 not null,
  run_after timestamp with time zone default timezone('utc'::text, now()) not null,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

create table public.ai_message_analysis (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  intent public.ai_intent,
  confidence_score float,
  extracted_json jsonb,
  priority_score text,
  needs_human_review boolean default false,
  model_name text,
  prompt_version text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.action_requests (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  source_message_id uuid references public.messages(id) not null,
  created_by uuid references public.profiles(id) not null,
  assigned_user_id uuid references public.profiles(id),
  action_type public.action_type not null,
  title text not null,
  description text,
  state public.action_state default 'pending' not null,
  due_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone
);

create table public.action_responses (
  id uuid default gen_random_uuid() primary key,
  action_request_id uuid references public.action_requests(id) on delete cascade not null,
  responder_id uuid references public.profiles(id) not null,
  response_status public.response_status not null,
  response_note text,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.checklist_items (
  id uuid default gen_random_uuid() primary key,
  action_request_id uuid references public.action_requests(id) on delete cascade not null,
  label text not null,
  category public.checklist_category not null,
  state public.checklist_state default 'unchecked' not null,
  confirmed_by uuid references public.profiles(id),
  confirmed_at timestamp with time zone
);

create table public.evidence_items (
  id uuid default gen_random_uuid() primary key,
  action_response_id uuid references public.action_responses(id) on delete cascade not null,
  submitted_by uuid references public.profiles(id) not null,
  evidence_type public.evidence_type not null,
  evidence_url text,
  evidence_label text,
  verification_status public.verification_status default 'unverified' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.audit_events (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  actor_id uuid references public.profiles(id),
  event_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
