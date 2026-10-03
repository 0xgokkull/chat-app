-- 003_add_delete_policies.sql
drop policy if exists "Group owners can delete their groups" on public.groups;
create policy "Group owners can delete their groups" on public.groups
  for delete using (created_by = auth.uid());

drop policy if exists "Users can delete messages" on public.messages;
create policy "Users can delete messages" on public.messages
  for delete using (
    sender_id = auth.uid() or
    exists (
      select 1 from public.groups
      where id = public.messages.group_id and created_by = auth.uid()
    )
  );
