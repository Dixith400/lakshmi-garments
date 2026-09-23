import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Store } from 'lucide-react';

export default function ShopSettings() {
  const [form, setForm] = useState({ 
    shop_name: '', 
    address: '', 
    phone: '', 
    logo_url: '', 
    owner_photo_url: ''  
  });
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { 
    api('/settings')
      .then((data) => {
        if (data) {
          // Safeguard: Ensure no key is undefined if the backend returns a partial object
          setForm({
            shop_name: data.shop_name || '',
            address: data.address || '',
            phone: data.phone || '',
            logo_url: data.logo_url || '',
            owner_photo_url: data.owner_photo_url || ''
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        setErrorMsg('Could not load settings. Please check if the backend server is running.');
      }); 
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setMsg('');
    setErrorMsg('');
    try {
      await api('/settings', { method: 'PUT', body: form });
      setMsg('Shop details saved successfully.');
    } catch (err) {
      console.error("Failed to save settings:", err);
      setErrorMsg('Failed to save settings. Server error (500).');
    }
  };

  const inputClass = "w-full bg-ivory rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand";

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h2 className="text-xl font-serif font-bold text-ink mb-4 flex items-center gap-2">
        <Store size={20} /> Shop Details
      </h2>

      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
        {errorMsg && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="text-xs text-ink/50 mb-1 block">Shop Name</label>
          <input 
            placeholder="Shop name" 
            value={form.shop_name || ''} 
            onChange={set('shop_name')} 
            className={inputClass} 
          />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Address</label>
          <textarea 
            placeholder="Address" 
            value={form.address || ''} 
            onChange={set('address')} 
            className={inputClass + " min-h-[80px]"} 
          />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Phone</label>
          <input 
            placeholder="Phone" 
            value={form.phone || ''} 
            onChange={set('phone')} 
            className={inputClass} 
          />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Logo URL</label>
          <input 
            placeholder="Logo URL" 
            value={form.logo_url || ''} 
            onChange={set('logo_url')} 
            className={inputClass} 
          />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Owner Photo URL (shown on homepage banner)</label>
          <input 
            placeholder="https://..." 
            value={form.owner_photo_url || ''} 
            onChange={set('owner_photo_url')} 
            className={inputClass} 
          />
        </div>

        <button 
          onClick={save} 
          className="w-full bg-brand text-white font-semibold py-2.5 rounded-full hover:bg-brand-dark transition-colors mt-2"
        >
          Save
        </button>
        
        {msg && <p className="text-green-700 text-sm font-medium mt-2">{msg}</p>}
      </div>
    </div>
  );
}
