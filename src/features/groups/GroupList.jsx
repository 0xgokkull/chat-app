import React, { useState, useEffect } from 'react';
import { fetchUserGroups, createGroup } from './groups.service';
import { useAuth } from '../auth/useAuth';

export default function GroupList({ selectedGroupId, onSelectGroup }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(true);

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

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const newGroup = await createGroup(newGroupName, user.id);
      setGroups([...groups, newGroup]);
      setNewGroupName('');
      onSelectGroup(newGroup.id);
    } catch (e) {
      console.error('Error creating group:', e);
      alert('Failed to create group. (Make sure you ran the SQL Schema and RLS).');
    }
  }

  if (loading) return <div className="text-gray-500 text-sm">Loading groups...</div>;

  return (
    <div className="flex flex-col h-full">
      <ul className="flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar pr-2">
        {groups.length === 0 ? (
          <li className="text-gray-500 text-sm">No groups yet.</li>
        ) : (
          groups.map(g => (
            <li key={g.id}>
              <button
                onClick={() => onSelectGroup(g.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedGroupId === g.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
              >
                <span className="font-semibold">{g.name}</span>
              </button>
            </li>
          ))
        )}
      </ul>
      <form onSubmit={handleCreateGroup} className="flex gap-2">
        <input 
          type="text" 
          placeholder="New group..." 
          value={newGroupName} 
          onChange={(e) => setNewGroupName(e.target.value)} 
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
        />
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all">
          +
        </button>
      </form>
    </div>
  );
}
