import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else navigate('/');
  };

  // Google OAuth — after Google redirects back, the auth listener in
  // lib/auth.jsx picks up the session automatically (no navigate needed).
  const loginWithGoogle = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) setError(error.message);
  };

  return (
    <div className="page">
      <h2>Login</h2>
      <form onSubmit={handleLogin} className="form">
        <input type="email" placeholder="Email" value={email}
               onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password}
               onChange={(e) => setPassword(e.target.value)} required />
        <p><Link to="/forgot-password">Forgot password?</Link></p>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn">Login</button>
        <button type="button" className="btn" onClick={loginWithGoogle}>
          Continue with Google
        </button>
      </form>
      <p>No account? <Link to="/register">Register</Link></p>
    </div>
  );
}
