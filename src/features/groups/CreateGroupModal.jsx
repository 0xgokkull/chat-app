import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../auth/useAuth';

export default function CreateGroupModal({ onClose, onCreate }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [connections, setConnections] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadConnections() {
      if (!user) return;
      const { data: accepted } = await supabase
        .from('connections')
        .select('id, requester_id, recipient_id, status, requester:requester_id(id, display_name, username), recipient:recipient_id(id, display_name, username)')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
      
      if (accepted) {
        const formatted = accepted.map(conn => {
          const friend = conn.requester_id === user.id ? conn.recipient : conn.requester;
          return { ...conn, friend };
        });
        setConnections(formatted);
      }
    }
    loadConnections();
  }, [user]);

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name, Array.from(selectedIds));
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-black/80 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-[-100%] w-[200%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-45deg] pointer-events-none"></div>
        
        <h2 className="text-xl font-bold text-white mb-4">Create New Workspace</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-indigo-300/80 uppercase tracking-wider mb-2">Workspace Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Project Apollo" 
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-indigo-300/80 uppercase tracking-wider mb-2">Invite Connections</label>
            <div className="bg-white/5 border border-white/10 rounded-xl max-h-48 overflow-y-auto custom-scrollbar p-2">
              {connections.length === 0 ? (
                <div className="text-gray-500 text-sm p-2 italic text-center">No connections yet. Add some in the Network tab!</div>
              ) : (
                connections.map(conn => (
                  <label key={conn.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(conn.friend.id)}
                      onChange={() => toggleSelect(conn.friend.id)}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 text-indigo-500 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="text-white text-sm font-semibold">{conn.friend.display_name}</div>
                      <div className="text-gray-400 text-xs">{conn.friend.username}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
