import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Tag, Trash2 } from 'lucide-react';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api('/categories').then(setCategories).catch(() => {});
  useEffect(() => { load(); }, []);

  const add = async () => {
    setError(''); setMsg('');
    if (!name.trim()) return;
    try {
      await api('/categories', { method: 'POST', body: { name: name.trim() } });
      setName('');
      setMsg('Category added.');
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this category? Products in it will become uncategorized.')) return;
    await api(`/categories/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-xl font-serif font-bold text-ink mb-4 flex items-center gap-2">
        <Tag size={20} /> Manage Categories
      </h2>

      <div className="bg-white rounded-2xl shadow-sm p-5 flex gap-3 mb-8">
        <input
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-ivory rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button onClick={add} className="bg-brand text-white font-semibold px-5 rounded-full hover:bg-brand-dark transition-colors">
          Add
        </button>
      </div>
      {error && <p className="text-red-600 text-sm -mt-6 mb-6">{error}</p>}
      {msg && <p className="text-green-700 text-sm -mt-6 mb-6">{msg}</p>}

      <h3 className="text-lg font-serif font-semibold text-ink mb-3">All Categories</h3>
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm px-4 py-3 flex justify-between items-center">
            <span className="font-medium text-ink">{c.name}</span>
            <button onClick={() => remove(c.id)} className="text-red-500 hover:text-red-700 p-1">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}