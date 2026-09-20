import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

const EMPTY = {
  name: '', description: '', category_id: '', price: 0, stock: 0,
  sizes: '', colors: '', image_url: ''
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => api('/products').then(setProducts).catch(() => {});
  useEffect(() => {
    load();
    api('/categories').then(setCategories).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    const body = {
      ...form,
      category_id: form.category_id || null,
      price: Number(form.price),
      stock: Number(form.stock),
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean)
    };
    if (editingId) {
      await api(`/products/${editingId}`, { method: 'PATCH', body });
      setMsg('Product updated.');
    } else {
      await api('/products', { method: 'POST', body });
      setMsg('Product added.');
    }
    setForm(EMPTY); setEditingId(null); load();
  };

  const edit = (p) => {
    setEditingId(p.id);
    setForm({
      ...p,
      category_id: p.category_id || '',
      sizes: p.sizes.join(', '),
      colors: p.colors.join(', ')
    });
  };

  const remove = async (id) => {
    await api(`/products/${id}`, { method: 'DELETE' }); load();
  };

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || 'Uncategorized';

  return (
    <div className="page">
      <h2>{editingId ? 'Edit Product' : 'Add Product'}</h2>
      <div className="form">
        <label>Product Name</label>
        <input placeholder="e.g. Silk Saree - Red" value={form.name} onChange={set('name')} />

        <label>Description</label>
        <textarea placeholder="Short description shown on the product page" value={form.description} onChange={set('description')} />

        <label>Category</label>
        <select value={form.category_id} onChange={set('category_id')}>
          <option value="">-- No category --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label>Price (₹)</label>
        <input type="number" placeholder="e.g. 1499" value={form.price} onChange={set('price')} />

        <label>Stock</label>
        <input type="number" placeholder="e.g. 20" value={form.stock} onChange={set('stock')} />

        <label>Sizes (optional — leave blank if not applicable)</label>
        <input placeholder="e.g. XL, M, S" value={form.sizes} onChange={set('sizes')} />

        <label>Colors (optional — leave blank if not applicable)</label>
        <input placeholder="e.g. Red, Blue" value={form.colors} onChange={set('colors')} />

        <label>Image URL</label>
        <input placeholder="https://..." value={form.image_url} onChange={set('image_url')} />

        <button className="btn" onClick={save}>{editingId ? 'Update' : 'Add'} Product</button>
        {editingId && <button className="btn-link" onClick={() => { setEditingId(null); setForm(EMPTY); }}>Cancel edit</button>}
        {msg && <p className="success">{msg}</p>}
      </div>

      <h2>All Products</h2>
      {products.map((p) => (
        <div className="card" key={p.id}>
          <h3>{p.name} — ₹{p.price} · stock {p.stock} · {p.sold_count} sold</h3>
          <p className="muted">{categoryName(p.category_id)}</p>
          <p className="muted">{p.sizes.join(' / ') || 'No sizes'} · {p.colors.join(' / ') || 'No colors'}</p>
          <button className="btn-link" onClick={() => edit(p)}>Edit</button>
          <button className="btn-link danger" onClick={() => remove(p.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}