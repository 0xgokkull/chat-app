import React from 'react';
import ActionCard from './ActionCard';

export default function MessageBubble({ msg, isMe }) {
  const senderName = msg.profiles?.display_name || msg.profiles?.email || 'Unknown';
  
  // A system message (like an action result) has different styling
  const isSystem = msg.message_type === 'action_result' || msg.message_type === 'system';

  return (
    <div className={`flex flex-col ${isSystem ? 'items-center my-2' : isMe ? 'items-end' : 'items-start'}`}>
      {!isMe && !isSystem && <span className="text-xs text-gray-400 mb-1 ml-1">{senderName}</span>}
      
      <div className={`max-w-[75%] p-4 rounded-2xl ${
        isSystem 
          ? 'bg-indigo-500/10 text-indigo-200 border border-indigo-500/20 text-center text-sm px-6 rounded-full w-full max-w-lg' 
          : isMe 
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm shadow-lg shadow-indigo-500/20' 
            : 'bg-white/10 text-gray-100 rounded-bl-sm border border-white/5 shadow-md backdrop-blur-md'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
        
        {!isSystem && (
          <span className={`text-[10px] mt-2 block font-medium tracking-wide ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        {/* Render Action Cards inline within the message bubble! */}
        {msg.action_requests && msg.action_requests.length > 0 && (
          <div className="mt-2 space-y-2">
            {msg.action_requests.map(req => (
              <ActionCard key={req.id} request={req} assigneeName={req.assignee?.display_name || req.assignee?.email || 'Someone'} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
