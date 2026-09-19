import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

const EMPTY = {
  name: '', description: '', category: 'garments', price: 0, stock: 0,
  sizes: 'XL, M, S', colors: 'Red, Blue', image_url: ''
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => api('/products').then(setProducts).catch(() => {});
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    const body = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean)
    };
    if (editingId) {
      await api(`/products/${editingId}`, { method: 'PATCH', body });
      setMsg('Product updated (price & stock saved).');
    } else {
      await api('/products', { method: 'POST', body });
      setMsg('Product added.');
    }
    setForm(EMPTY); setEditingId(null); load();
  };

  const edit = (p) => {
    setEditingId(p.id);
    setForm({ ...p, sizes: p.sizes.join(', '), colors: p.colors.join(', ') });
  };

  const remove = async (id) => {
    await api(`/products/${id}`, { method: 'DELETE' }); load();
  };

  return (
    <div className="page">
      <h2>{editingId ? 'Edit Product' : 'Add Product'}</h2>
      <div className="form">
        <input placeholder="Name" value={form.name} onChange={set('name')} />
        <textarea placeholder="Description" value={form.description} onChange={set('description')} />
        <select value={form.category} onChange={set('category')}>
          <option value="garments">Garments</option>
          <option value="jewelry">Jewelry</option>
        </select>
        <input type="number" placeholder="Price ₹" value={form.price} onChange={set('price')} />
        <input type="number" placeholder="Stock" value={form.stock} onChange={set('stock')} />
        <input placeholder="Sizes (comma separated: XL, M, S, custom…)" value={form.sizes} onChange={set('sizes')} />
        <input placeholder="Colors (comma separated)" value={form.colors} onChange={set('colors')} />
        <input placeholder="Image URL (optional)" value={form.image_url} onChange={set('image_url')} />
        <button className="btn" onClick={save}>{editingId ? 'Update' : 'Add'} Product</button>
        {editingId && <button className="btn-link" onClick={() => { setEditingId(null); setForm(EMPTY); }}>Cancel edit</button>}
        {msg && <p className="success">{msg}</p>}
      </div>

      <h2>All Products</h2>
      {products.map((p) => (
        <div className="card" key={p.id}>
          <h3>{p.name} — ₹{p.price} · stock {p.stock} · {p.sold_count} sold</h3>
          <p className="muted">{p.sizes.join(' / ')} · {p.colors.join(' / ')}</p>
          <button className="btn-link" onClick={() => edit(p)}>Edit</button>
          <button className="btn-link danger" onClick={() => remove(p.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
