import React from 'react';
import ActionCard from './ActionCard';

export default function MessageBubble({ msg, isMe, currentUser, isAdmin, onDelete }) {
  const senderName = msg.profiles?.display_name || msg.profiles?.username || (msg.profiles?.email ? msg.profiles.email.split('@')[0] : 'Unknown');
  
  const isSystem = msg.message_type === 'action_result' || msg.message_type === 'system';
  const isAiNotice = msg.message_type === 'ai_notice';

  return (
    <div className={`flex flex-col ${isSystem || isAiNotice ? 'items-center my-4' : isMe ? 'items-end' : 'items-start'} animate-slide-up`}>
      {!isMe && !isSystem && !isAiNotice && <span className="text-xs text-warm-muted mb-1 ml-1">{senderName}</span>}
      
      <div className={`group/bubble p-3 ${
        isAiNotice 
          ? 'bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 text-[#4A3B2F] rounded-[1.5rem] w-full max-w-[90%] shadow-ai-glow animate-slide-up relative overflow-hidden backdrop-blur-md'
          : isSystem 
            ? 'bg-white/30 text-[#4A3B2F] border border-white/50 backdrop-blur-md text-center px-6 rounded-full w-full max-w-lg shadow-sm' 
            : isMe 
              ? 'bg-gradient-to-br from-[#F48E6E] to-[#D96540] text-white rounded-[1.5rem] rounded-br-sm shadow-md border border-[#F48E6E]/50 max-w-[75%] relative' 
              : 'bg-white/40 text-[#4A3B2F] rounded-[1.5rem] rounded-bl-sm border border-white/60 shadow-sm backdrop-blur-md max-w-[75%] relative'
      }`}>
        {(isMe || isAdmin) && !isSystem && !isAiNotice && (
          <button 
            onClick={onDelete}
            className={`absolute top-2 ${isMe ? '-left-10' : '-right-10'} opacity-0 group-hover/bubble:opacity-100 p-2 rounded-full hover:bg-red-100 text-red-400 transition-all shadow-sm bg-white/80`}
            title="Delete Message"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}

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
          <span className={`text-[10px] mt-2 block font-medium tracking-wide ${isMe ? 'text-white/80' : 'text-[#A49380]'}`}>
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
