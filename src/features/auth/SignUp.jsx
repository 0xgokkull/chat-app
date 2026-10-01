import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    const validUsername = /^[a-zA-Z0-9_]+$/.test(username);
    if (!validUsername) {
      return setErrorMessage('Username can only contain letters, numbers, and underscores.');
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
      });
      if (error) throw error;

      if (data?.user) {
        const { error: profileError } = await supabase.from('profiles').upsert([{
          id: data.user.id,
          email: email,
          display_name: displayName,
          username: `@${username.toLowerCase()}`
        }]);

        if (profileError) {
          if (profileError.code === '23505') {
            throw new Error('Username is already taken.');
          }
          throw profileError;
        }
      }
      
      navigate('/');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center mesh-bg text-white selection:bg-indigo-500 font-sans relative overflow-hidden">
      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[150px] opacity-30 animate-float-delayed pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[150px] opacity-30 animate-float pointer-events-none"></div>
      
      <div className="w-full max-w-md p-8 relative z-10 animate-float">
        <div className="glass-panel p-10 rounded-3xl relative overflow-hidden">
          {/* Shine effect */}
          <div className="absolute top-0 left-[-100%] w-[200%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-45deg] animate-[shine_3s_ease-in-out_infinite]"></div>

          <div className="text-center mb-10 relative z-10">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] overflow-hidden border border-white/10">
                <img src="/logo.jpg" alt="Chaat Logo" className="w-full h-full object-cover mix-blend-screen" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-indigo-200 via-white to-purple-300 mb-2 drop-shadow-sm">Chaat</h1>
            <p className="text-indigo-200/60 text-sm tracking-wide">Register your neural node</p>
          </div>
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center backdrop-blur-md">
              {errorMessage}
            </div>
          )}
          <form className="space-y-6 relative z-10" onSubmit={handleSignup}>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-indigo-300/80 uppercase tracking-wider">Display Name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Arun Kumar" className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white transition-all backdrop-blur-md" required />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-indigo-300/80 uppercase tracking-wider">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-gray-500 font-bold">@</span>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="arun_dev" className="w-full pl-10 pr-5 py-4 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white transition-all backdrop-blur-md" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-indigo-300/80 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white transition-all backdrop-blur-md" required />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-indigo-300/80 uppercase tracking-wider">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-white transition-all backdrop-blur-md" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold tracking-wide py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creating node...' : 'Create Account'}
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-gray-400 relative z-10">
            Already have an account? <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
