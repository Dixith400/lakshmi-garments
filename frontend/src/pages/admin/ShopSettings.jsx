import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Store } from 'lucide-react';

export default function ShopSettings() {
  const [form, setForm] = useState({ shop_name: '', address: '', phone: '', logo_url: '', owner_photo_url: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { api('/settings').then(setForm).catch(() => {}); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    await api('/settings', { method: 'PUT', body: form });
    setMsg('Shop details saved.');
  };

  const inputClass = "w-full bg-ivory rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand";

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h2 className="text-xl font-serif font-bold text-ink mb-4 flex items-center gap-2">
        <Store size={20} /> Shop Details
      </h2>

      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Shop Name</label>
          <input placeholder="Shop name" value={form.shop_name} onChange={set('shop_name')} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Address</label>
          <textarea placeholder="Address" value={form.address} onChange={set('address')} className={inputClass + " min-h-[80px]"} />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Phone</label>
          <input placeholder="Phone" value={form.phone} onChange={set('phone')} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Logo URL</label>
          <input placeholder="Logo URL" value={form.logo_url} onChange={set('logo_url')} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Owner Photo URL (shown on homepage banner)</label>
          <input placeholder="https://..." value={form.owner_photo_url} onChange={set('owner_photo_url')} className={inputClass} />
        </div>

        <button onClick={save} className="w-full bg-brand text-white font-semibold py-2.5 rounded-full hover:bg-brand-dark transition-colors">
          Save
        </button>
        {msg && <p className="text-green-700 text-sm">{msg}</p>}
      </div>
    </div>
  );
}