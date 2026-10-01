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
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-white/5 border-r border-white/10 flex flex-col p-6 backdrop-blur-xl z-20">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Intelligence Chat</h1>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
          <p className="text-gray-400 text-sm font-semibold mb-4 uppercase tracking-wider">Your Groups</p>
          <GroupList selectedGroupId={selectedGroupId} onSelectGroup={setSelectedGroupId} />
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
          <span className="text-xs text-gray-500 truncate mr-2">{user?.email}</span>
          <button onClick={handleLogout} className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">
            Log Out
          </button>
        </div>
      </div>
      
      {/* Main Chat */}
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
