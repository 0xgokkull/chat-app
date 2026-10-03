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

function WarmClayBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 bg-[#E8DACB] overflow-hidden">
      {/* Soft luxurious gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] bg-[#FFF6E9] rounded-full mix-blend-overlay filter blur-[120px] opacity-90 animate-blob"></div>
      <div className="absolute top-[10%] right-[-10%] w-[60%] h-[80%] bg-[#F48E6E] rounded-full mix-blend-multiply filter blur-[150px] opacity-25 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-30%] left-[10%] w-[70%] h-[60%] bg-[#B0967D] rounded-full mix-blend-multiply filter blur-[130px] opacity-20 animate-blob animation-delay-4000"></div>
      
      {/* Noise */}
      <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
    </div>
  );
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
    <div className="flex h-screen w-screen text-[#4A3B2F] font-sans overflow-hidden relative p-2 md:p-6 lg:p-8">
      <WarmClayBackground />
      
      {/* Premium Glass Container */}
      <div className="w-full h-full max-w-[1500px] mx-auto rounded-[2rem] bg-white/20 backdrop-blur-3xl border border-white/40 shadow-[0_40px_80px_rgba(74,59,47,0.1)] flex overflow-hidden relative z-10">
        
        {/* Sidebar */}
        <div className="w-[320px] shrink-0 bg-white/10 border-r border-white/20 flex flex-col p-6 relative">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F48E6E] to-[#D96540] flex items-center justify-center shadow-lg shadow-[#F48E6E]/30 overflow-hidden border border-white/20">
                <img src="/logo.jpg" alt="Chaat Logo" className="w-full h-full object-cover mix-blend-screen opacity-90" />
              </div>
              <h1 className="text-2xl font-extrabold text-[#4A3B2F] tracking-tight">Chaat</h1>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0 relative z-10">
            <GroupList selectedGroupId={selectedGroupId} onSelectGroup={setSelectedGroupId} />
          </div>

          <div className="mt-4 pt-6 border-t border-white/20 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-white/40 border border-white/50 shadow-sm flex items-center justify-center flex-shrink-0">
                 <span className="text-sm font-bold text-[#4A3B2F]">{(user?.user_metadata?.display_name || user?.email || 'U')[0].toUpperCase()}</span>
              </div>
              <span className="text-sm font-semibold text-[#4A3B2F] truncate drop-shadow-sm">{user?.user_metadata?.display_name || (user?.email ? user.email.split('@')[0] : 'User')}</span>
            </div>
            <button onClick={handleLogout} className="text-[#A49380] hover:text-[#D96540] transition-colors p-2 hover:bg-white/30 rounded-xl shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex min-w-0 min-h-0 bg-transparent">
          <ChatWindow groupId={selectedGroupId} />
        </div>
      </div>
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
