import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

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
    <div className="page">
      <h2>Manage Categories</h2>
      <div className="form">
        <input placeholder="New category name" value={name}
               onChange={(e) => setName(e.target.value)} />
        <button className="btn" onClick={add}>Add Category</button>
        {error && <p className="error">{error}</p>}
        {msg && <p className="success">{msg}</p>}
      </div>

      <h2>All Categories</h2>
      {categories.map((c) => (
        <div className="card" key={c.id}>
          <h3>{c.name}</h3>
          <button className="btn-link danger" onClick={() => remove(c.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}