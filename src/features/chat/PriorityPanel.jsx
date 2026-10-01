import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../auth/useAuth';
import ActionCard from './ActionCard';

export default function PriorityPanel({ groupId, onClose }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      if (!groupId || !user) return;
      
      const { data, error } = await supabase
        .from('action_requests')
        .select(`
          id, title, description, action_type, state, due_at, group_id, assigned_user_id,
          assignee:assigned_user_id(display_name, username, avatar_url)
        `)
        .eq('group_id', groupId)
        .eq('state', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRequests(data);
      }
      setLoading(false);
    }

    fetchRequests();
  }, [groupId, user]);

  return (
    <div className="w-80 border-l border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col h-full animate-slide-in-right z-20 shadow-2xl relative">
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>
      
      <div className="px-6 py-6 border-b border-white/10 flex justify-between items-center relative z-10">
        <h2 className="text-lg font-bold text-white tracking-wide">Action Items</h2>
        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative z-10">
        {loading ? (
          <div className="text-center text-indigo-300 mt-10 animate-pulse text-sm">Loading tasks...</div>
        ) : requests.length === 0 ? (
          <div className="text-center mt-10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <svg className="w-8 h-8 text-indigo-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">No pending action items.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <ActionCard 
                key={req.id} 
                request={req} 
                assigneeName={req.assignee?.display_name || req.assignee?.email || 'Someone'} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
