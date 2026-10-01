import { supabase } from '../../lib/supabaseClient';

export async function fetchUserGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select('*, group_members!inner(role)');
  if (error) throw error;
  return data;
}

export async function createGroup(name, userId) {
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert([{ name, created_by: userId }])
    .select()
    .single();

  if (groupError) throw groupError;

  const { error: memberError } = await supabase
    .from('group_members')
    .insert([{ group_id: group.id, user_id: userId, role: 'owner' }]);

  if (memberError) throw memberError;

  return group;
}
