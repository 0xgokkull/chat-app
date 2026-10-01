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
    <div className="flex-1 flex flex-col relative bg-transparent">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5 bg-black/20 backdrop-blur-2xl z-10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse"></div>
          <h2 className="text-xl font-bold text-white tracking-wide">Encrypted Channel</h2>
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
  );
}
