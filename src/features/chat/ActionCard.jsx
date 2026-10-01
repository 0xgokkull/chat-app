import React, { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import ActionResponseModal from './ActionResponseModal';

export default function ActionCard({ request, assigneeName }) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAssignee = user?.id === request.assigned_user_id;

  const stateColors = {
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    responded: 'bg-green-500/20 text-green-300 border-green-500/30',
    expired: 'bg-red-500/20 text-red-300 border-red-500/30',
    cancelled: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  };

  const stateColor = stateColors[request.state] || stateColors.pending;

  return (
    <>
      <div className="mt-3 p-4 rounded-xl bg-black/40 border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.2)] backdrop-blur-md relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
        
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h4 className="font-bold text-white text-sm tracking-wide">{request.title}</h4>
          </div>
          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${stateColor}`}>
            {request.state}
          </span>
        </div>

        {request.description && (
          <p className="text-gray-400 text-xs mt-1 mb-3 leading-relaxed">
            {request.description}
          </p>
        )}

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <span className="text-[10px] text-indigo-300">{assigneeName?.charAt(0)?.toUpperCase() || '?'}</span>
            </div>
            <span className="text-xs text-gray-500">
              Assigned to <strong className="text-indigo-300 font-medium">{isAssignee ? 'You' : assigneeName || 'Unknown'}</strong>
            </span>
          </div>

          {isAssignee && request.state === 'pending' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-[0_0_10px_rgba(79,70,229,0.3)] hover:shadow-[0_0_15px_rgba(79,70,229,0.5)] border border-indigo-500/50"
            >
              Respond
            </button>
          )}
        </div>
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
