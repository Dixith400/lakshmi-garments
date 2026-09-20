import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { Mail, Lock } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else navigate('/');
  };

  const registerWithGoogle = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) setError(error.message);
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-14">
      <div className="bg-white rounded-2xl shadow-sm p-7">
        <h2 className="text-2xl font-serif font-bold text-ink text-center mb-6">Create Account</h2>

        <form onSubmit={handleRegister} className="space-y-3">
          <div className="relative">
            <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input type="email" placeholder="Email" value={email}
                   onChange={(e) => setEmail(e.target.value)} required
                   className="w-full bg-ivory rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <div className="relative">
            <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input type="password" placeholder="Password (min 6 chars)" value={password}
                   onChange={(e) => setPassword(e.target.value)} required
                   className="w-full bg-ivory rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <button type="submit" className="w-full bg-brand text-white font-semibold py-2.5 rounded-full hover:bg-brand-dark transition-colors">
            Register
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-ink/10 flex-1" />
          <span className="text-ink/40 text-xs">OR</span>
          <div className="h-px bg-ink/10 flex-1" />
        </div>

        <button onClick={registerWithGoogle}
                className="w-full flex items-center justify-center gap-2 bg-ivory text-ink font-medium py-2.5 rounded-full shadow-sm hover:shadow transition-shadow">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.8 2.73v2.27h2.92c1.71-1.57 2.68-3.88 2.68-6.64z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34C2.44 15.98 5.48 18 9 18z"/><path fill="#FBBC05" d="M3.97 10.71c-.18-.54-.28-1.11-.28-1.71s.1-1.17.28-1.71V4.95H.96C.35 6.17 0 7.54 0 9s.35 2.83.96 4.05l3.01-2.34z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-ink/60 mt-5">
          Have an account? <Link to="/login" className="text-brand font-medium underline">Login</Link>
        </p>
      </div>
    </div>
  );
}