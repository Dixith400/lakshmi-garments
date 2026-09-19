import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

export default function ShopSettings() {
  const [form, setForm] = useState({ shop_name: '', address: '', phone: '', logo_url: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { api('/settings').then(setForm).catch(() => {}); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    await api('/settings', { method: 'PUT', body: form });
    setMsg('Shop details saved.');
  };

  return (
    <div className="page">
      <h2>Shop Details</h2>
      <div className="form">
        <input placeholder="Shop name" value={form.shop_name} onChange={set('shop_name')} />
        <textarea placeholder="Address" value={form.address} onChange={set('address')} />
        <input placeholder="Phone" value={form.phone} onChange={set('phone')} />
        <input placeholder="Logo URL" value={form.logo_url} onChange={set('logo_url')} />
        <button className="btn" onClick={save}>Save</button>
        {msg && <p className="success">{msg}</p>}
      </div>
    </div>
  );
}
