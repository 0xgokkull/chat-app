import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Login from '../features/auth/Login';
import SignUp from '../features/auth/SignUp';
import { useAuth } from '../features/auth/useAuth';
import GroupList from '../features/groups/GroupList';
import ChatWindow from '../features/chat/ChatWindow';
import { supabase } from '../lib/supabaseClient';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function MainLayout() {
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function checkInvite() {
      if (!user) return;
      const params = new URLSearchParams(location.search);
      const inviteCode = params.get('invite');
      if (inviteCode) {
        // Find group by invite code
        const { data: group } = await supabase
          .from('groups')
          .select('id')
          .eq('invite_code', inviteCode)
          .single();
        
        if (group) {
          // Join group
          await supabase.from('group_members').upsert({
            group_id: group.id,
            user_id: user.id,
            role: 'member'
          }, { onConflict: 'group_id,user_id' });
          
          setSelectedGroupId(group.id);
          // Remove the query parameter from URL
          navigate('/', { replace: true });
        }
      }
    }
    checkInvite();
  }, [user, location.search, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-screen sandstone-bg text-sandstone-900 font-sans overflow-hidden">
      {/* Sidebar - Sandstone */}
      <div className="w-80 bg-sandstone-200/90 border-r border-sandstone-300 flex flex-col p-6 z-20 shadow-[2px_0_20px_rgba(80,50,20,0.05)] relative backdrop-blur-md">
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20 overflow-hidden border border-accent-light">
              <img src="/logo.jpg" alt="Chaat Logo" className="w-full h-full object-cover mix-blend-screen opacity-90" />
            </div>
            <h1 className="text-2xl font-extrabold text-sandstone-900 tracking-tight">Chaat</h1>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          <p className="text-warm-muted text-xs font-bold mb-4 uppercase tracking-widest">Your Workspaces</p>
          <GroupList selectedGroupId={selectedGroupId} onSelectGroup={setSelectedGroupId} />
        </div>

        <div className="mt-4 pt-6 border-t border-sandstone-300 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-sandstone-300 border border-sandstone-800/10 flex items-center justify-center flex-shrink-0">
               <span className="text-xs font-bold text-sandstone-800">{user?.email?.[0].toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-sandstone-800 truncate">{user?.email}</span>
          </div>
          <button onClick={handleLogout} className="text-warm-muted hover:text-accent-hover transition-colors p-2 hover:bg-sandstone-300/50 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Main Chat Area - Transparent to let sandstone-bg show through */}
      <ChatWindow groupId={selectedGroupId} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}
