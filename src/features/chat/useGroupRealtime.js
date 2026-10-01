import { useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function useGroupRealtime(groupId, onNewMessage) {
  useEffect(() => {
    if (!groupId) return;
    
    const channel = supabase.channel(`group:${groupId}`, { config: { presence: { key: groupId } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` }, async (payload) => {
        console.log('REALTIME PAYLOAD RECEIVED:', payload);
        const rawMsg = payload.new;
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, username, avatar_url')
          .eq('id', rawMsg.sender_id)
          .single();
          
        onNewMessage({ ...rawMsg, profiles: profile });
      })
      .subscribe((status, err) => {
        console.log('Realtime subscription status:', status, err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, onNewMessage]);
}
