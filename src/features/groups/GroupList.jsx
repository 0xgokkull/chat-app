import React, { useState, useEffect } from 'react';
import { fetchUserGroups, createGroup } from './groups.service';
import { useAuth } from '../auth/useAuth';
import ConnectionsPanel from '../chat/ConnectionsPanel';
import CreateGroupModal from './CreateGroupModal';

export default function GroupList({ selectedGroupId, onSelectGroup }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' | 'network'
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  async function loadGroups() {
    try {
      const data = await fetchUserGroups();
      setGroups(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup(name, memberIds) {
    try {
      const newGroup = await createGroup(name, user.id, memberIds);
      setGroups([...groups, newGroup]);
      onSelectGroup(newGroup.id);
      setShowCreateModal(false);
    } catch (e) {
      console.error('Error creating group:', e);
      alert('Failed to create group. (Make sure you ran the SQL Schema and RLS).');
    }
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex gap-2 mb-6 p-1.5 bg-white/30 backdrop-blur-md rounded-xl border border-white/40 relative z-10 shadow-sm">
        <button 
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === 'groups' ? 'bg-white shadow-sm text-[#D96540]' : 'text-[#A49380] hover:text-[#4A3B2F]'}`}
        >
          Groups
        </button>
        <button 
          onClick={() => setActiveTab('network')}
          className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === 'network' ? 'bg-white shadow-sm text-[#D96540]' : 'text-[#A49380] hover:text-[#4A3B2F]'}`}
        >
          Network
        </button>
      </div>

      {activeTab === 'groups' ? (
        <>
          <ul className="flex-1 overflow-y-auto space-y-1 mb-4 custom-scrollbar pr-2 relative z-10">
            {loading ? (
              <li className="text-warm-muted text-sm animate-pulse text-center mt-4">Loading groups...</li>
            ) : groups.length === 0 ? (
              <li className="text-warm-muted text-sm text-center mt-4 italic">No groups yet.</li>
            ) : (
              groups.map(g => (
                <li key={g.id}>
                  <div className={`w-full group/item flex items-center justify-between px-5 py-4 rounded-[1.25rem] transition-all duration-300 ${selectedGroupId === g.id ? 'bg-gradient-to-r from-[#F48E6E] to-[#D96540] text-white shadow-md shadow-[#F48E6E]/30 translate-x-1' : 'bg-transparent text-[#4A3B2F] hover:bg-white/40'}`}>
                    <button
                      onClick={() => onSelectGroup(g.id)}
                      className="flex-1 text-left"
                    >
                      <span className="font-bold tracking-wide">{g.name}</span>
                    </button>
                    {g.created_by === user.id && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this workspace?')) {
                            await import('../../lib/supabaseClient').then(({ supabase }) => 
                              supabase.from('groups').delete().eq('id', g.id)
                            );
                            setGroups(groups.filter(group => group.id !== g.id));
                            if (selectedGroupId === g.id) onSelectGroup(null);
                          }
                        }}
                        className={`p-2 rounded-xl transition-all opacity-0 group-hover/item:opacity-100 ${selectedGroupId === g.id ? 'hover:bg-white/20 text-white' : 'hover:bg-red-100 text-red-500'}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
          <div className="relative z-10 mt-auto pt-4">
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="w-full bg-white/60 hover:bg-white/90 border border-white/80 text-[#D96540] py-3.5 rounded-[1.25rem] text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New Workspace
            </button>
          </div>
        </>
      ) : (
        <ConnectionsPanel />
      )}

      {showCreateModal && (
        <CreateGroupModal 
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </div>
  );
}
