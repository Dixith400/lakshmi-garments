// Every data request goes to the FastAPI backend with the user's Supabase token.
import { supabase } from './supabaseClient';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function api(path, { method = 'GET', body } = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { 'Content-Type': 'application/json' };
  if (session) headers.Authorization = `Bearer ${session.access_token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}
