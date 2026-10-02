-- 009_relax_action_request_rls.sql

drop policy if exists "Only action requester or group admin can update action state" on public.action_requests;

-- Allow any member of the group to update the action request
create policy "Any group member can update action state" on public.action_requests
  for update using (
    public.is_member_of(group_id)
  );
