import React from 'react';

export default function MessageBubble({ msg, isMe }) {
  const senderName = msg.profiles?.display_name || msg.profiles?.email || 'Unknown';
  
  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      {!isMe && <span className="text-xs text-gray-400 mb-1 ml-1">{senderName}</span>}
      <div className={`max-w-[70%] p-4 rounded-2xl ${isMe ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm shadow-lg shadow-indigo-500/20' : 'bg-white/10 text-gray-100 rounded-bl-sm border border-white/5 shadow-md'}`}>
        <p className="text-sm leading-relaxed">{msg.body}</p>
        <span className={`text-[10px] mt-2 block font-medium tracking-wide ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>
          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
