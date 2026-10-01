import { supabase } from '../../lib/supabaseClient';

export async function fetchUserGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, created_at, group_members!inner(role)');
  if (error) throw error;
  return data;
}

export async function createGroup(name, userId, memberIds = []) {
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert([{ name, created_by: userId }])
    .select('id, name, created_at')
    .single();

  if (groupError) throw groupError;

  // Prepare members array including the creator as 'owner'
  const membersToInsert = [
    { group_id: group.id, user_id: userId, role: 'owner' },
    ...memberIds.map(mId => ({ group_id: group.id, user_id: mId, role: 'member' }))
  ];

  const { error: memberError } = await supabase
    .from('group_members')
    .insert(membersToInsert);

  if (memberError) throw memberError;

  return group;
}
