import { useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function useGroupRealtime(groupId, onNewMessage) {
  useEffect(() => {
    if (!groupId) return;
    
    const channel = supabase.channel(`group:${groupId}`, { config: { presence: { key: groupId } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` }, (payload) => {
        onNewMessage(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, onNewMessage]);
}
