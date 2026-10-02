import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../auth/useAuth';
import { useGroupRealtime } from './useGroupRealtime';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';

export default function ChatWindow({ groupId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState(null);
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    
    // Fetch group invite code
    const { data: groupData } = await supabase.from('groups').select('invite_code').eq('id', groupId).single();
    if (groupData) {
      setInviteCode(groupData.invite_code);
    }

    const { data, error } = await supabase
      .from('messages')
      .select(`
        id, group_id, sender_id, body, message_type, created_at, client_message_id,
        profiles:sender_id ( display_name, username, avatar_url ),
        action_requests (
          id, action_type, title, description, state, due_at, group_id, assigned_user_id,
          assignee:assigned_user_id(display_name, username, avatar_url),
          checklist_items (id, label, category, state, confirmed_by, confirmed_at, profiles:confirmed_by (display_name, avatar_url, email))
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });
    
    if (!error) {
      setMessages(data || []);
      scrollToBottom();
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleNewMessage = useCallback((newMsg) => {
    console.log('[ChatWindow] handleNewMessage triggered for:', newMsg.id);
    setMessages(prev => {
      // Find existing message by DB id or client_message_id
      const existingIndex = prev.findIndex(m => 
        m.id === newMsg.id || 
        (newMsg.client_message_id && m.id === newMsg.client_message_id) ||
        (newMsg.client_message_id && m.client_message_id === newMsg.client_message_id)
      );

      if (existingIndex >= 0) {
        console.log('[ChatWindow] Updating existing message at index', existingIndex);
        const updated = [...prev];
        updated[existingIndex] = { 
          ...newMsg, 
          // Preserve profiles if we already fetched them (e.g. from initial load or sender)
          profiles: updated[existingIndex].profiles || newMsg.profiles,
          // Preserve action_requests when updating
          action_requests: updated[existingIndex].action_requests || newMsg.action_requests || []
        };
        return updated;
      }
      
      console.log('[ChatWindow] Appending brand new message');
      return [...prev, newMsg];
    });
  }, []);

  const handleActionRequestUpdate = useCallback((messageId, actionRequest, clientMessageId) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId || (clientMessageId && msg.id === clientMessageId) || (clientMessageId && msg.client_message_id === clientMessageId)) {
        const currentRequests = msg.action_requests || [];
        const existingIndex = currentRequests.findIndex(r => r.id === actionRequest.id);
        
        let newRequests;
        if (existingIndex >= 0) {
          newRequests = [...currentRequests];
          newRequests[existingIndex] = actionRequest;
        } else {
          newRequests = [...currentRequests, actionRequest];
        }
        return { ...msg, action_requests: newRequests };
      }
      return msg;
    }));
  }, []);

  useGroupRealtime(groupId, handleNewMessage, handleActionRequestUpdate);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (body) => {
    if (!body.trim() || !groupId) return;
    
    const clientMessageId = crypto.randomUUID();
    const tempMsg = {
      id: clientMessageId,
      client_message_id: clientMessageId,
      group_id: groupId,
      sender_id: user.id,
      body,
      message_type: 'user',
      created_at: new Date().toISOString(),
      profiles: { display_name: user.display_name, username: user.username, email: user.email }
    };
    
    setMessages(prev => [...prev, tempMsg]);

    try {
      const { data, error } = await supabase.from('messages').insert([{
        group_id: groupId,
        sender_id: user.id,
        body,
        client_message_id: clientMessageId
      }]).select().single();

      if (data) {
        // Update the temp message with the real DB id instantly so action_requests can link to it
        setMessages(prev => prev.map(m => m.id === clientMessageId ? { ...m, id: data.id } : m));
      }
    } catch (e) {
      console.error('Failed to send:', e);
    }
  };

  if (!groupId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-sandstone-800 relative bg-transparent">
        <div className="w-28 h-28 bg-sandstone-50 rounded-[2rem] flex items-center justify-center mb-8 border border-sandstone-300 shadow-sand animate-float">
           <svg className="w-12 h-12 text-accent drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
        </div>
        <p className="text-xl font-medium text-sandstone-900 tracking-wide">Select a workspace to begin collaboration</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex relative overflow-hidden bg-transparent">
      <div className="flex-1 flex flex-col relative bg-transparent z-10">
        {/* Header */}
        <div className="px-8 py-4 border-b border-sandstone-300 bg-sandstone-100/80 backdrop-blur-2xl z-20 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-accent"></div>
              <h2 className="text-xl font-bold text-sandstone-900 tracking-wide">Encrypted Channel</h2>
            </div>
            <p className="text-xs text-warm-muted mt-0.5 font-medium ml-4">End-to-end encrypted · Secure Workspace</p>
          </div>
          <div className="flex items-center gap-3">
            {inviteCode && (
              <button 
                onClick={() => {
                  const url = `${window.location.origin}/?invite=${inviteCode}`;
                  navigator.clipboard.writeText(url);
                  alert('Invite link copied to clipboard!');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sandstone-50 hover:bg-sandstone-300 text-sandstone-900 border border-sandstone-300 transition-all font-bold text-sm shadow-sm"
              >
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Copy Invite Link
              </button>
            )}
            <button className="p-2 text-sandstone-800 hover:bg-sandstone-300 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-8 overflow-y-auto z-10 flex flex-col gap-6 custom-scrollbar bg-transparent">
          {loading && <div className="text-center text-warm-muted animate-pulse">Syncing...</div>}
          {!loading && messages.length === 0 && (
            <div className="text-center text-warm-muted mt-10 italic">Channel established. Awaiting input.</div>
          )}
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} isMe={msg.sender_id === user.id} currentUser={user} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="p-6 bg-sandstone-100/90 backdrop-blur-3xl border-t border-sandstone-300 z-10">
          <MessageComposer onSend={sendMessage} />
        </div>
      </div>

    </div>
  );
}
