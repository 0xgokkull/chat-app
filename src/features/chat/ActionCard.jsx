import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import ActionResponseModal from './ActionResponseModal';
import { supabase } from '../../lib/supabaseClient';
import { broadcastToGroup } from './useGroupRealtime';

export default function ActionCard({ request, assigneeName, currentUser }) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localRequest, setLocalRequest] = useState(request);

  // Sync local state when the authoritative request prop updates from Realtime
  React.useEffect(() => {
    setLocalRequest(request);
  }, [request]);

  const isAssignee = user?.id === localRequest.assigned_user_id;

  const stateColors = {
    pending: 'bg-sandstone-200 text-sandstone-800 border-sandstone-300',
    responded: 'bg-accent/10 text-accent border-accent/20',
    expired: 'bg-red-50 text-red-500 border-red-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  const stateColor = stateColors[localRequest.state] || stateColors.pending;

  return (
    <>
      <div className={`mt-2 p-3 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-[#F48E6E]/10 hover:-translate-y-0.5 animate-slide-up`}>
        
        {!(localRequest.action_type === 'checklist' && localRequest.state === 'pending') && (
          <div className="flex justify-between items-start mb-1.5">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h4 className="font-bold text-sandstone-900 text-xs tracking-wide">{localRequest.title}</h4>
            </div>
            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${stateColor}`}>
              {localRequest.state}
            </span>
          </div>
        )}

        {localRequest.description && (
          <p className="text-sandstone-800 text-[11px] mt-1 mb-2 leading-relaxed">
            {localRequest.description}
          </p>
        )}

        {localRequest.action_type === 'checklist' && localRequest.state === 'pending' && (
          <div className="flex flex-col gap-2 p-2 mt-1 rounded-lg bg-white/50 border border-white/70 shadow-ai-glow animate-ai-pulse backdrop-blur-sm">
            <p className="text-xs text-accent font-semibold flex items-center gap-1.5">
              <span className="animate-bounce">✨</span> AI Suggestion: Convert into interactive checklist?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={async () => {
                  setLocalRequest(prev => ({ ...prev, state: 'responded' }));
                  await supabase.from('action_requests').update({ state: 'responded' }).eq('id', localRequest.id);
                  await broadcastToGroup(localRequest.group_id, 'action_request_updated', { id: localRequest.id });
                }}
                className="px-4 py-1.5 bg-gradient-to-br from-[#F48E6E] to-[#D96540] text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-[#F48E6E]/30"
              >
                Yes, convert
              </button>
              <button 
                onClick={async () => {
                  setLocalRequest(prev => ({ ...prev, state: 'cancelled' }));
                  await supabase.from('action_requests').update({ state: 'cancelled' }).eq('id', localRequest.id);
                  await broadcastToGroup(localRequest.group_id, 'action_request_updated', { id: localRequest.id });
                }}
                className="px-4 py-1.5 bg-white/60 hover:bg-white/80 border border-white/80 text-[#4A3B2F] text-xs font-bold rounded-lg transition-all"
              >
                No, dismiss
              </button>
            </div>
          </div>
        )}

        {localRequest.action_type === 'checklist' && localRequest.state === 'responded' && localRequest.checklist_items && (
          <div className="mt-1.5 mb-2 space-y-1">
            {localRequest.checklist_items.map((item, index) => (
              <div key={item.id} className="flex items-start gap-2 bg-white/50 p-2 rounded-md border border-sandstone-300/50 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}>
                <input
                  type="checkbox"
                  checked={item.state === 'confirmed'}
                  onChange={async (e) => {
                    const newState = e.target.checked ? 'confirmed' : 'unchecked';
                    
                    // Optimistic update
                    setLocalRequest(prev => {
                      const newItems = prev.checklist_items.map(i => 
                        i.id === item.id 
                          ? { ...i, state: newState, profiles: e.target.checked ? user : null } 
                          : i
                      );
                      return { ...prev, checklist_items: newItems };
                    });

                    await supabase
                      .from('checklist_items')
                      .update({ state: newState, confirmed_by: e.target.checked ? user?.id : null, confirmed_at: e.target.checked ? new Date().toISOString() : null })
                      .eq('id', item.id);
                    await broadcastToGroup(localRequest.group_id, 'action_request_updated', { id: localRequest.id });
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-sandstone-300 bg-white text-accent focus:ring-accent/50 cursor-pointer"
                />
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${item.state === 'confirmed' ? 'text-sandstone-800 line-through' : 'text-sandstone-900'}`}>
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

        {!(localRequest.action_type === 'checklist' && localRequest.state === 'pending') && (
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-sandstone-300">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-sandstone-200 flex items-center justify-center border border-sandstone-300">
                <span className="text-[10px] font-bold text-sandstone-800">{assigneeName?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
              <span className="text-xs text-warm-muted">
                {localRequest.action_type === 'checklist' ? 'Created by' : 'Assigned to'} <strong className="text-sandstone-900 font-semibold">{isAssignee ? 'You' : assigneeName || 'Unknown'}</strong>
              </span>
            </div>

            {isAssignee && localRequest.state === 'pending' && localRequest.action_type !== 'checklist' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-1.5 bg-gradient-to-br from-[#F48E6E] to-[#D96540] hover:scale-105 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-[#F48E6E]/30"
              >
                Respond
              </button>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <ActionResponseModal
          request={localRequest}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
