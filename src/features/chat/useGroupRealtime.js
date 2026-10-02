import { useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function useGroupRealtime(groupId, onNewMessage, onUpdateActionRequest) {
  useEffect(() => {
    if (!groupId) return;
    
    console.log('[Realtime] Initializing channel for group:' + groupId);
    
    // CHANNEL 1: Messages only (Isolated to guarantee stability)
    const channelMessages = supabase.channel('messages:' + groupId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        console.log('[Realtime] MESSAGE RECEIVED:', payload.new);
        if (payload.new.group_id === groupId) {
          // Fetch the sender's profile so it doesn't show as 'unknown'
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url, email')
            .eq('id', payload.new.sender_id)
            .single();

          const messageWithProfile = {
            ...payload.new,
            profiles: profileData || null
          };

          onNewMessage(messageWithProfile);
        }
      })
      .subscribe();

    // CHANNEL 2: Action Requests & Checklists
    // (Separated so if RLS policies crash this channel, it doesn't kill messages)
    const channelActions = supabase.channel('actions:' + groupId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'action_requests' }, async (payload) => {
        if (!payload.new || !payload.new.id) return;
        if (payload.new.group_id !== groupId) return;
        
        const { data: actionRequest } = await supabase
          .from('action_requests')
          .select('id, action_type, title, description, state, due_at, group_id, assigned_user_id, source_message_id, assignee:assigned_user_id(display_name, username, avatar_url), checklist_items (id, label, category, state, confirmed_by, confirmed_at, profiles:confirmed_by (display_name, avatar_url, email))')
          .eq('id', payload.new.id)
          .single();
          
        if (actionRequest) {
          const { data: sourceMsg } = await supabase
            .from('messages')
            .select('client_message_id')
            .eq('id', actionRequest.source_message_id)
            .single();

          if (onUpdateActionRequest) {
            onUpdateActionRequest(actionRequest.source_message_id, actionRequest, sourceMsg?.client_message_id);
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items' }, async (payload) => {
        const actionRequestId = payload.new.action_request_id || payload.old.action_request_id;
        if (!actionRequestId) return;
        
        const { data: actionRequest } = await supabase
          .from('action_requests')
          .select('id, action_type, title, description, state, due_at, group_id, assigned_user_id, source_message_id, assignee:assigned_user_id(display_name, username, avatar_url), checklist_items (id, label, category, state, confirmed_by, confirmed_at, profiles:confirmed_by (display_name, avatar_url, email))')
          .eq('id', actionRequestId)
          .single();
          
        if (actionRequest && actionRequest.group_id === groupId) {
          const { data: sourceMsg } = await supabase
            .from('messages')
            .select('client_message_id')
            .eq('id', actionRequest.source_message_id)
            .single();

          if (onUpdateActionRequest) {
            onUpdateActionRequest(actionRequest.source_message_id, actionRequest, sourceMsg?.client_message_id);
          }
        }
      })
      .subscribe();

    return () => {
      console.log('[Realtime] Removing channels for group:' + groupId);
      supabase.removeChannel(channelMessages);
      supabase.removeChannel(channelActions);
    };
  }, [groupId, onNewMessage, onUpdateActionRequest]);
}
