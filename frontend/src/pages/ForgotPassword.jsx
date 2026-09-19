import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) setError(error.message);
    else setMsg('Check your email for a password reset link.');
  };

  return (
    <div className="page">
      <h2>Forgot Password</h2>
      <form onSubmit={handleReset} className="form">
        <input type="email" placeholder="Email" value={email}
               onChange={(e) => setEmail(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        {msg && <p className="success">{msg}</p>}
        <button type="submit" className="btn">Send Reset Link</button>
      </form>
      <p><Link to="/login">Back to Login</Link></p>
    </div>
  );
}