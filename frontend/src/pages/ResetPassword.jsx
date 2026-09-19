import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  // Supabase's email link logs the user into a temporary recovery session
  // automatically; this page just lets them set a new password.
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setMsg('Password updated. Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="page">
      <h2>Reset Password</h2>
      <form onSubmit={handleUpdate} className="form">
        <input type="password" placeholder="New password (min 6 chars)" value={password}
               onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        {msg && <p className="success">{msg}</p>}
        <button type="submit" className="btn">Update Password</button>
      </form>
    </div>
  );
}