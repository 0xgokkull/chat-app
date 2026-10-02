import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import ActionResponseModal from './ActionResponseModal';
import { supabase } from '../../lib/supabaseClient';

export default function ActionCard({ request, assigneeName, currentUser }) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAssignee = user?.id === request.assigned_user_id;

  const stateColors = {
    pending: 'bg-sandstone-200 text-sandstone-800 border-sandstone-300',
    responded: 'bg-accent/10 text-accent border-accent/20',
    expired: 'bg-red-50 text-red-500 border-red-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  const stateColor = stateColors[request.state] || stateColors.pending;

  return (
    <>
      <div className={`mt-3 p-4 rounded-xl bg-sandstone-50 border border-sandstone-300 shadow-sand relative overflow-hidden group`}>
        
        {!(request.action_type === 'checklist' && request.state === 'pending') && (
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h4 className="font-bold text-sandstone-900 text-sm tracking-wide">{request.title}</h4>
            </div>
            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${stateColor}`}>
              {request.state}
            </span>
          </div>
        )}

        {request.description && (
          <p className="text-sandstone-800 text-xs mt-1 mb-3 leading-relaxed">
            {request.description}
          </p>
        )}

        {request.action_type === 'checklist' && request.state === 'pending' && (
          <div className="flex flex-col gap-3 p-3 mt-1 rounded-xl bg-accent/5 border border-accent/20 shadow-ai-glow animate-ai-pulse">
            <p className="text-sm text-accent font-medium flex items-center gap-2">
              <span className="animate-bounce">✨</span> AI Suggestion: Would you like to convert this message into an interactive checklist?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={async () => {
                  await supabase.from('action_requests').update({ state: 'responded' }).eq('id', request.id);
                }}
                className="px-4 py-1.5 bg-gradient-to-r from-accent via-[#ffb973] to-accent bg-[length:200%_auto] animate-shimmer text-white text-xs font-bold rounded-lg transition-all shadow-sm shadow-accent/20"
              >
                Yes, convert
              </button>
              <button 
                onClick={async () => {
                  await supabase.from('action_requests').update({ state: 'cancelled' }).eq('id', request.id);
                }}
                className="px-4 py-1.5 bg-sandstone-200 hover:bg-sandstone-300 text-sandstone-900 text-xs font-bold rounded-lg transition-all"
              >
                No, dismiss
              </button>
            </div>
          </div>
        )}

        {request.action_type === 'checklist' && request.state === 'responded' && request.checklist_items && (
          <div className="mt-2 mb-3 space-y-1.5">
            {request.checklist_items.map((item, index) => (
              <div key={item.id} className="flex items-start gap-3 bg-white/50 p-2.5 rounded-lg border border-sandstone-300/50 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}>
                <input
                  type="checkbox"
                  checked={item.state === 'confirmed'}
                  onChange={async (e) => {
                    const newState = e.target.checked ? 'confirmed' : 'unchecked';
                    await supabase
                      .from('checklist_items')
                      .update({ state: newState, confirmed_by: e.target.checked ? user?.id : null, confirmed_at: e.target.checked ? new Date().toISOString() : null })
                      .eq('id', item.id);
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-sandstone-300 bg-white text-accent focus:ring-accent/50 cursor-pointer"
                />
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${item.state === 'confirmed' ? 'text-sandstone-800 line-through' : 'text-sandstone-900'}`}>
                      {item.label}
                    </span>
                    {item.state === 'confirmed' && item.profiles && (
                      <div className="flex items-center ml-2" title={`Confirmed by ${item.profiles.display_name || item.profiles.email}`}>
                        {item.profiles.avatar_url ? (
                          <img src={item.profiles.avatar_url} alt="avatar" className="w-5 h-5 rounded-full border border-sandstone-200" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-sandstone-200 text-sandstone-900 flex items-center justify-center text-[10px] font-bold border border-sandstone-300">
                            {(item.profiles.display_name || item.profiles.email || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] uppercase text-warm-muted font-bold tracking-wider mt-0.5">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!(request.action_type === 'checklist' && request.state === 'pending') && (
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-sandstone-300">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-sandstone-200 flex items-center justify-center border border-sandstone-300">
                <span className="text-[10px] font-bold text-sandstone-800">{assigneeName?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
              <span className="text-xs text-warm-muted">
                {request.action_type === 'checklist' ? 'Created by' : 'Assigned to'} <strong className="text-sandstone-900 font-semibold">{isAssignee ? 'You' : assigneeName || 'Unknown'}</strong>
              </span>
            </div>

            {isAssignee && request.state === 'pending' && request.action_type !== 'checklist' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-lg transition-all shadow-sm"
              >
                Respond
              </button>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <ActionResponseModal
          request={request}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
