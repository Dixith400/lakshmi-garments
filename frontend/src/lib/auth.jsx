// Small auth context: current user + whether backend says they are admin.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Ask the backend who this user is (backend checks ADMIN_USER_IDS from its .env)
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    api('/me')
      .then((me) => setIsAdmin(!!me.is_admin))
      .catch(() => setIsAdmin(false));
  }, [user]);

  const logout = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
