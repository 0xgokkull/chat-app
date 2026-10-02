import React from 'react';
import ActionCard from './ActionCard';

export default function MessageBubble({ msg, isMe, currentUser }) {
  const senderName = msg.profiles?.display_name || msg.profiles?.email || 'Unknown';
  
  const isSystem = msg.message_type === 'action_result' || msg.message_type === 'system';
  const isAiNotice = msg.message_type === 'ai_notice';

  return (
    <div className={`flex flex-col ${isSystem || isAiNotice ? 'items-center my-4' : isMe ? 'items-end' : 'items-start'}`}>
      {!isMe && !isSystem && !isAiNotice && <span className="text-xs text-warm-muted mb-1 ml-1">{senderName}</span>}
      
      <div className={`p-4 ${
        isAiNotice 
          ? 'bg-accent/5 border border-accent/30 text-sandstone-900 rounded-2xl w-full max-w-[90%] shadow-ai-glow animate-slide-up relative overflow-hidden'
          : isSystem 
            ? 'bg-sandstone-200/50 text-sandstone-800 border border-sandstone-300 text-center text-sm px-6 rounded-full w-full max-w-lg' 
            : isMe 
              ? 'bg-sandstone-300 text-sandstone-900 rounded-2xl rounded-br-sm shadow-sm max-w-[75%]' 
              : 'bg-sandstone-50 text-sandstone-900 rounded-2xl rounded-bl-sm border border-sandstone-300 shadow-sm max-w-[75%]'
      }`}>
        {isAiNotice && (
          <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
        )}
        
        {isAiNotice && (
          <div className="flex items-center gap-2 mb-3 border-b border-accent/20 pb-2">
            <span className="text-lg animate-bounce">✨</span>
            <span className="font-bold text-sm tracking-widest text-accent uppercase bg-clip-text">AI Daily Priority Recap</span>
          </div>
        )}

        <p className={`leading-relaxed whitespace-pre-wrap text-sm`}>{msg.body}</p>
        
        {!isSystem && !isAiNotice && (
          <span className={`text-[10px] mt-2 block font-medium tracking-wide ${isMe ? 'text-sandstone-800' : 'text-warm-muted'}`}>
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        {/* Render Action Cards inline within the message bubble! */}
        {msg.action_requests && msg.action_requests.length > 0 && (
          <div className="mt-2 space-y-2">
            {msg.action_requests.filter(req => req.state !== 'cancelled').map(req => (
              <ActionCard key={req.id} request={req} assigneeName={req.assignee?.display_name || req.assignee?.email || 'Someone'} currentUser={currentUser} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
