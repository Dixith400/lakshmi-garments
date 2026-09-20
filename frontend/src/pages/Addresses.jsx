import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const EMPTY = {
  addressee_name: '', address_line1: '', address_line2: '',
  city: '', state: '', pin_code: '', country: 'India'
};

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api('/addresses').then(setAddresses).catch(() => {});
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setError(''); setMsg('');
    if (!form.addressee_name || !form.address_line1 || !form.city || !form.state || !form.pin_code) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      await api('/addresses', { method: 'POST', body: form });
      setForm(EMPTY);
      setMsg('Address saved.');
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (id) => {
    await api(`/addresses/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="page">
      <h2>Add a New Address</h2>
      <div className="form">
        <label>Addressee Name (who this is being delivered to)</label>
        <input placeholder="e.g. Dixith Kumar" value={form.addressee_name} onChange={set('addressee_name')} />

        <label>Address Line 1 (House/Flat No., Building, Street)</label>
        <input placeholder="e.g. 12, Green Apartments, MG Road" value={form.address_line1} onChange={set('address_line1')} />

        <label>Address Line 2 (Locality / Area — optional)</label>
        <input placeholder="e.g. Jayanagar, Sector 4" value={form.address_line2} onChange={set('address_line2')} />

        <label>City / Town</label>
        <input placeholder="e.g. Bengaluru" value={form.city} onChange={set('city')} />

        <label>State</label>
        <input placeholder="e.g. Karnataka" value={form.state} onChange={set('state')} />

        <label>PIN Code</label>
        <input placeholder="e.g. 560041" value={form.pin_code} onChange={set('pin_code')} maxLength={6} />

        <label>Country</label>
        <input value={form.country} onChange={set('country')} />

        <button className="btn" onClick={save}>Save Address</button>
        {error && <p className="error">{error}</p>}
        {msg && <p className="success">{msg}</p>}
      </div>

      <h2>Saved Addresses</h2>
      {addresses.length === 0 && <p className="muted">No saved addresses yet.</p>}
      {addresses.map((a) => (
        <div className="card" key={a.id}>
          <p><b>{a.addressee_name}</b></p>
          <p>{a.address_line1}</p>
          {a.address_line2 && <p>{a.address_line2}</p>}
          <p>{a.city}, {a.state} — {a.pin_code}</p>
          <p>{a.country}</p>
          <button className="btn-link danger" onClick={() => remove(a.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}