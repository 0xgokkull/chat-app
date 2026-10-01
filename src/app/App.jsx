import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-screen mesh-bg text-white font-sans overflow-hidden">
      {/* Sidebar - Glassmorphic */}
      <div className="w-80 bg-black/40 border-r border-white/5 flex flex-col p-6 backdrop-blur-3xl z-20 shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none"></div>
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center shadow-lg shadow-indigo-500/10 overflow-hidden border border-white/10">
              <img src="/logo.jpg" alt="Chaat Logo" className="w-full h-full object-cover mix-blend-screen" />
            </div>
            <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white">Chaat</h1>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          <p className="text-indigo-300 text-xs font-bold mb-4 uppercase tracking-widest">Your Workspaces</p>
          <GroupList selectedGroupId={selectedGroupId} onSelectGroup={setSelectedGroupId} />
        </div>

        <div className="mt-4 pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-white/20 flex items-center justify-center flex-shrink-0">
               <span className="text-xs font-bold">{user?.email?.[0].toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-gray-300 truncate">{user?.email}</span>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Main Chat Area - Transparent to let mesh-bg show through */}
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
