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
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles:sender_id ( display_name, email )
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
      if (prev.find(m => m.id === newMsg.id)) return prev;
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
      group_id: groupId,
      sender_id: user.id,
      body,
      message_type: 'user',
      created_at: new Date().toISOString(),
      profiles: { email: user.email }
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
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 relative bg-[#0f0f13]">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-inner">
           <svg className="w-10 h-10 text-indigo-400 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
        </div>
        <p className="text-lg">Select a group to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative bg-[#0f0f13]">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/10 bg-white/5 backdrop-blur-md z-10 shadow-sm flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white tracking-wide">Group Chat</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 p-8 overflow-y-auto z-10 flex flex-col gap-6 custom-scrollbar">
        {loading && <div className="text-center text-gray-500">Loading messages...</div>}
        {!loading && messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">No messages yet. Be the first!</div>
        )}
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} isMe={msg.sender_id === user.id} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="p-6 bg-[#0f0f13]/80 backdrop-blur-xl border-t border-white/10 z-10">
        <MessageComposer onSend={sendMessage} />
      </div>
    </div>
  );
}
