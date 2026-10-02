import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../auth/useAuth';

export default function ConnectionsPanel() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  async function loadConnections() {
    // Load incoming pending requests
    const { data: incoming } = await supabase
      .from('connections')
      .select('id, status, created_at, requester:requester_id(id, display_name, username)')
      .eq('recipient_id', user.id)
      .eq('status', 'pending');
    
    setPendingRequests(incoming || []);

    // Load accepted connections
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

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    
    const query = searchQuery.startsWith('@') ? searchQuery : `@${searchQuery}`;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, username')
      .ilike('username', `%${query}%`)
      .neq('id', user.id)
      .limit(5);
      
    if (!error && data) {
      setSearchResults(data);
    }
    setLoading(false);
  }

  async function sendRequest(recipientId) {
    const { error } = await supabase.from('connections').insert([{
      requester_id: user.id,
      recipient_id: recipientId,
      status: 'pending'
    }]);

    if (error) {
      if (error.code === '23505' || error.message.includes('duplicate')) {
        alert('You already have a pending or active connection with this user!');
      } else {
        console.error(error);
        alert('Failed to send request.');
      }
      return;
    }

    alert('Connection request sent!');
    setSearchResults([]);
    setSearchQuery('');
  }

  async function respondRequest(connectionId, status) {
    await supabase.from('connections')
      .update({ status })
      .eq('id', connectionId);
    loadConnections();
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="mb-6">
        <h3 className="text-sm font-bold text-warm-muted uppercase tracking-wider mb-3">Add Connection</h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search @username..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-sandstone-50 border border-sandstone-300 rounded-xl px-4 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/50 text-sandstone-900 backdrop-blur-md placeholder-warm-muted"
          />
          <button type="submit" disabled={loading} className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm shadow-accent/20">
            {loading ? '...' : 'Find'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map(profile => (
              <div key={profile.id} className="flex items-center justify-between p-3 rounded-xl bg-sandstone-50 border border-sandstone-300 shadow-sm">
                <div>
                  <div className="text-sandstone-900 font-semibold text-sm">{profile.display_name}</div>
                  <div className="text-sandstone-800 text-xs">{profile.username}</div>
                </div>
                <button onClick={() => sendRequest(profile.id)} className="px-3 py-1 bg-sandstone-200 hover:bg-sandstone-300 rounded-lg text-xs font-bold text-sandstone-900 transition-colors">
                  Connect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            Pending Requests
          </h3>
          <div className="space-y-2">
            {pendingRequests.map(req => (
              <div key={req.id} className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                <div className="text-sandstone-900 font-semibold text-sm">{req.requester.display_name}</div>
                <div className="text-accent text-xs mb-2">{req.requester.username}</div>
                <div className="flex gap-2">
                  <button onClick={() => respondRequest(req.id, 'accepted')} className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-1.5 rounded-lg text-xs font-bold border border-green-200 transition-all">Accept</button>
                  <button onClick={() => respondRequest(req.id, 'rejected')} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-1.5 rounded-lg text-xs font-bold border border-red-200 transition-all">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold text-warm-muted uppercase tracking-wider mb-3">Your Network</h3>
        <div className="space-y-2">
          {connections.length === 0 ? (
             <div className="text-warm-muted text-xs italic">No connections yet. Find someone!</div>
          ) : (
            connections.map(conn => (
              <div key={conn.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-sandstone-200 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-sandstone-200 flex items-center justify-center border border-sandstone-300">
                  <span className="text-xs font-bold text-sandstone-800">{conn.friend.display_name?.charAt(0)}</span>
                </div>
                <div>
                  <div className="text-sandstone-900 text-sm font-semibold">{conn.friend.display_name}</div>
                  <div className="text-warm-muted text-xs">{conn.friend.username}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
