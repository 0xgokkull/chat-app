import { useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export async function broadcastToGroup(groupId, event, payload) {
  const topic = 'realtime:group:' + groupId;
  const channel = supabase.getChannels().find(c => c.topic === topic);
  if (channel) {
    return channel.send({ type: 'broadcast', event, payload });
  } else {
    console.warn('[Realtime] Cannot broadcast, channel not found for topic:', topic);
  }
}

export function useGroupRealtime(groupId, onNewMessage, onUpdateActionRequest) {
  useEffect(() => {
    if (!groupId) return;
    
    console.log('[Realtime] Initializing channel for group:' + groupId);
    
    // We MUST use the same channel name for broadcast to work across clients
    const channelName = `group:${groupId}`;
    
    const handleActionRequestBroadcast = async ({ payload }) => {
        console.log('[Realtime] BROADCAST ACTION_REQUEST RECEIVED:', payload);
        const { data: actionRequest } = await supabase
          .from('action_requests')
          .select('id, action_type, title, description, state, due_at, group_id, assigned_user_id, source_message_id, assignee:assigned_user_id(display_name, username, avatar_url), checklist_items (id, label, category, state, confirmed_by, confirmed_at, profiles:confirmed_by (display_name, avatar_url, email))')
          .eq('id', payload.id)
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
    };

    const channel = supabase.channel(channelName)
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        console.log('[Realtime] BROADCAST MESSAGE RECEIVED:', payload);
        if (payload.group_id === groupId) {
          onNewMessage(payload);
        }
      })
      .on('broadcast', { event: 'action_request_created' }, handleActionRequestBroadcast)
      .on('broadcast', { event: 'action_request_updated' }, handleActionRequestBroadcast)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        console.log('[Realtime] MESSAGE RECEIVED:', payload.new);
        if (payload.new.group_id === groupId) {
          let profileData = null;
          if (payload.new.sender_id) {
            const { data } = await supabase
              .from('profiles')
              .select('display_name, avatar_url, email')
              .eq('id', payload.new.sender_id)
              .single();
            profileData = data;
          }

          const messageWithProfile = {
            ...payload.new,
            profiles: profileData
          };

          onNewMessage(messageWithProfile);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'action_requests' }, async (payload) => {
        console.log('[Realtime] ACTION_REQUEST RECEIVED:', payload);
        const id = payload.new?.id || payload.old?.id;
        if (!id) return;
        
        const { data: actionRequest } = await supabase
          .from('action_requests')
          .select('id, action_type, title, description, state, due_at, group_id, assigned_user_id, source_message_id, assignee:assigned_user_id(display_name, username, avatar_url), checklist_items (id, label, category, state, confirmed_by, confirmed_at, profiles:confirmed_by (display_name, avatar_url, email))')
          .eq('id', id)
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items' }, async (payload) => {
        const actionRequestId = payload.new?.action_request_id || payload.old?.action_request_id;
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
      .subscribe((status, err) => {
        console.log(`[Realtime] Channel status for group ${groupId}:`, status, err || '');
      });

    return () => {
      console.log(`[Realtime] Removing channel ${channelName} for group:` + groupId);
      supabase.removeChannel(channel);
    };
  }, [groupId, onNewMessage, onUpdateActionRequest]);
}
