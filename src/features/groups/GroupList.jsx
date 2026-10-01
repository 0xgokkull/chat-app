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
      <div className="flex gap-2 mb-6 p-1 bg-black/40 rounded-xl border border-white/5 backdrop-blur-md relative z-10">
        <button 
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'groups' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          Groups
        </button>
        <button 
          onClick={() => setActiveTab('network')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'network' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          Network
        </button>
      </div>

      {activeTab === 'groups' ? (
        <>
          <ul className="flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar pr-2 relative z-10">
            {loading ? (
              <li className="text-indigo-300 text-sm animate-pulse text-center mt-4">Loading groups...</li>
            ) : groups.length === 0 ? (
              <li className="text-gray-500 text-sm text-center mt-4 italic">No groups yet.</li>
            ) : (
              groups.map(g => (
                <li key={g.id}>
                  <button
                    onClick={() => onSelectGroup(g.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedGroupId === g.id ? 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] border border-indigo-400/30' : 'bg-black/40 border border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10'}`}
                  >
                    <span className="font-semibold tracking-wide">{g.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="relative z-10 mt-auto pt-2">
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="w-full bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
