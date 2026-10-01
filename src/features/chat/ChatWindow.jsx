import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../auth/useAuth';
import { useGroupRealtime } from './useGroupRealtime';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import PriorityPanel from './PriorityPanel';

export default function ChatWindow({ groupId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPriorityPanel, setShowPriorityPanel] = useState(false);
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
          assignee:assigned_user_id(display_name, username, avatar_url)
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
    setMessages(prev => {
      // Deduplicate by DB id or if the temporary message's ID matches the new message's client_message_id
      const isDuplicate = prev.some(m => 
        m.id === newMsg.id || 
        m.id === newMsg.client_message_id ||
        (m.client_message_id && m.client_message_id === newMsg.client_message_id)
      );

      if (isDuplicate) {
        // Replace the temporary message with the real one from the DB
        return prev.map(m => 
          (m.id === newMsg.client_message_id || m.client_message_id === newMsg.client_message_id) ? newMsg : m
        );
      }
      return [...prev, newMsg];
    });
  }, []);

  useGroupRealtime(groupId, handleNewMessage);

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
      await supabase.from('messages').insert([{
        group_id: groupId,
        sender_id: user.id,
        body,
        client_message_id: clientMessageId
      }]);
    } catch (e) {
      console.error('Failed to send:', e);
    }
  };

  if (!groupId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 relative bg-transparent">
        <div className="w-28 h-28 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border border-white/10 shadow-2xl backdrop-blur-md animate-float">
           <svg className="w-12 h-12 text-indigo-300 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
        </div>
        <p className="text-xl font-light text-indigo-100 tracking-wide">Select a workspace to initiate neural sync</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex relative overflow-hidden bg-transparent">
      <div className="flex-1 flex flex-col relative bg-transparent z-10">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 bg-black/20 backdrop-blur-2xl z-20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse"></div>
            <h2 className="text-xl font-bold text-white tracking-wide">Encrypted Channel</h2>
          </div>
          <div className="flex items-center gap-3">
            {inviteCode && (
              <button 
                onClick={() => {
                  const url = `${window.location.origin}/?invite=${inviteCode}`;
                  navigator.clipboard.writeText(url);
                  alert('Invite link copied to clipboard!');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-all font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Copy Invite Link
              </button>
            )}
            <button 
              onClick={() => setShowPriorityPanel(!showPriorityPanel)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-all font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Priority Panel
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-8 overflow-y-auto z-10 flex flex-col gap-6 custom-scrollbar bg-transparent">
          {loading && <div className="text-center text-indigo-300 animate-pulse">Syncing neural link...</div>}
          {!loading && messages.length === 0 && (
            <div className="text-center text-gray-400 mt-10 italic">Channel established. Awaiting input.</div>
          )}
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} isMe={msg.sender_id === user.id} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="p-6 bg-black/30 backdrop-blur-3xl border-t border-white/5 z-10">
          <MessageComposer onSend={sendMessage} />
        </div>
      </div>

      {/* Slide-over Priority Panel */}
      {showPriorityPanel && (
        <PriorityPanel groupId={groupId} onClose={() => setShowPriorityPanel(false)} />
      )}
    </div>
  );
}
