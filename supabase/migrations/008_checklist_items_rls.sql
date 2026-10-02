-- 008_checklist_items_rls.sql

drop policy if exists "Users can view checklist items in their groups" on public.checklist_items;
create policy "Users can view checklist items in their groups" on public.checklist_items
  for select using (
    exists (
      select 1 from public.action_requests ar
      where ar.id = public.checklist_items.action_request_id and public.is_member_of(ar.group_id)
    )
  );

drop policy if exists "Users can update checklist items in their groups" on public.checklist_items;
create policy "Users can update checklist items in their groups" on public.checklist_items
  for update using (
    exists (
      select 1 from public.action_requests ar
      where ar.id = public.checklist_items.action_request_id and public.is_member_of(ar.group_id)
    )
  );
