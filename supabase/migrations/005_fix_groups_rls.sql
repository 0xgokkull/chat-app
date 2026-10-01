-- 005_fix_groups_rls.sql

-- Allow group creators to view their groups immediately after creation
-- This prevents the RLS violation when Supabase attempts to return the inserted group 
-- before the group_members row is created.

DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

CREATE POLICY "Users can view groups they are members of" ON public.groups
  FOR SELECT USING (
    public.is_member_of(id) OR created_by = auth.uid()
  );
