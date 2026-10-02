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
          assignee:assigned_user_id(display_name, username, avatar_url),
          checklist_items(id, label, category, state, confirmed_by, confirmed_at)
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
    <div className="w-80 border-l border-sandstone-300 bg-sandstone-100/90 backdrop-blur-3xl flex flex-col h-full animate-slide-in-right z-20 shadow-sand relative">
      <div className="px-6 py-6 border-b border-sandstone-300 flex justify-between items-center relative z-10">
        <h2 className="text-lg font-bold text-sandstone-900 tracking-wide">Action Items</h2>
        <div className="flex gap-2">
          <button 
            onClick={async () => {
              try {
                await supabase.functions.invoke('generate-group-recap', {
                  body: { group_id: groupId }
                });
              } catch (e) {
                console.error("Failed to generate recap", e);
              }
            }}
            className="p-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-full transition-colors border border-accent/20"
            title="Generate AI Recap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          <button onClick={onClose} className="p-2 bg-sandstone-200 hover:bg-sandstone-300 rounded-full transition-colors">
            <svg className="w-4 h-4 text-sandstone-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative z-10">
        {loading ? (
          <div className="text-center text-warm-muted mt-10 animate-pulse text-sm">Loading tasks...</div>
        ) : requests.length === 0 ? (
          <div className="text-center mt-10">
            <div className="w-16 h-16 bg-sandstone-200 rounded-full flex items-center justify-center mx-auto mb-4 border border-sandstone-300">
              <svg className="w-8 h-8 text-accent/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-warm-muted text-sm">No pending action items.</p>
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
