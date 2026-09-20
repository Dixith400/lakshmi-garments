import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { MapPin, Trash2 } from 'lucide-react';

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

  const inputClass = "w-full bg-ivory rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-xl font-serif font-bold text-ink mb-4 flex items-center gap-2">
        <MapPin size={20} /> Add a New Address
      </h2>

      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3 mb-8">
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Addressee Name (who this is being delivered to)</label>
          <input placeholder="e.g. Dixith Kumar" value={form.addressee_name} onChange={set('addressee_name')} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Address Line 1 (House/Flat No., Building, Street)</label>
          <input placeholder="e.g. 12, Green Apartments, MG Road" value={form.address_line1} onChange={set('address_line1')} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Address Line 2 (Locality / Area — optional)</label>
          <input placeholder="e.g. Jayanagar, Sector 4" value={form.address_line2} onChange={set('address_line2')} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-ink/50 mb-1 block">City / Town</label>
            <input placeholder="e.g. Bengaluru" value={form.city} onChange={set('city')} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-ink/50 mb-1 block">State</label>
            <input placeholder="e.g. Karnataka" value={form.state} onChange={set('state')} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-ink/50 mb-1 block">PIN Code</label>
            <input placeholder="e.g. 560041" value={form.pin_code} onChange={set('pin_code')} maxLength={6} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Country</label>
            <input value={form.country} onChange={set('country')} className={inputClass} />
          </div>
        </div>

        <button onClick={save} className="w-full bg-brand text-white font-semibold py-2.5 rounded-full hover:bg-brand-dark transition-colors">
          Save Address
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {msg && <p className="text-green-700 text-sm">{msg}</p>}
      </div>

      <h2 className="text-lg font-serif font-semibold text-ink mb-3">Saved Addresses</h2>
      {addresses.length === 0 && <p className="text-ink/50 text-sm">No saved addresses yet.</p>}
      <div className="space-y-3">
        {addresses.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl shadow-sm p-4 flex justify-between items-start">
            <div className="text-sm">
              <p className="font-semibold text-ink">{a.addressee_name}</p>
              <p className="text-ink/70">{a.address_line1}</p>
              {a.address_line2 && <p className="text-ink/70">{a.address_line2}</p>}
              <p className="text-ink/70">{a.city}, {a.state} — {a.pin_code}</p>
              <p className="text-ink/70">{a.country}</p>
            </div>
            <button onClick={() => remove(a.id)} className="text-red-500 hover:text-red-700 p-1">
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}