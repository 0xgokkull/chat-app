import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/'); // Redirect to groups/home
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center sandstone-bg text-sandstone-900 selection:bg-accent/30 font-sans relative overflow-hidden">
      
      <div className="w-full max-w-md p-8 relative z-10 animate-float">
        <div className="bg-sandstone-50 border border-sandstone-300 p-10 rounded-3xl relative overflow-hidden shadow-sand">
          
          <div className="text-center mb-10 relative z-10">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20 overflow-hidden border border-accent-light">
                <img src="/logo.jpg" alt="Chaat Logo" className="w-full h-full object-cover mix-blend-screen opacity-90" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold text-sandstone-900 mb-2 tracking-tight">Chaat</h1>
            <p className="text-warm-muted text-sm tracking-wide">Enter your workspace</p>
          </div>
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm text-center">
              {errorMessage}
            </div>
          )}
          <form className="space-y-6 relative z-10" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-warm-muted uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 bg-white border border-sandstone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-sandstone-900 transition-all shadow-sm" required />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-warm-muted uppercase tracking-wider">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 bg-white border border-sandstone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-sandstone-900 transition-all shadow-sm" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent-hover text-white font-bold tracking-wide py-4 rounded-xl shadow-sm shadow-accent/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-sandstone-800 relative z-10">
            Don't have an account? <Link to="/signup" className="text-accent font-semibold hover:text-accent-hover transition-colors hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
