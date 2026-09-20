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
  const [imageFiles, setImageFiles] = useState([]);
  const [productImages, setProductImages] = useState({}); // productId -> [images]
  const [imageError, setImageError] = useState('');

  const load = () => api('/products').then(setProducts).catch(() => {});
  useEffect(() => {
    load();
    api('/categories').then(setCategories).catch(() => {});
  }, []);


  useEffect(() => {
    products.forEach((p) => loadImages(p.id));
  }, [products]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff'];

  const handleFileSelect = (e) => {
    setImageError('');
    const files = Array.from(e.target.files);
    const invalid = files.find((f) => !ALLOWED.includes(f.type));
    if (invalid) {
      setImageError(`"${invalid.name}" is not a supported format. Use JPEG, PNG, GIF, or TIFF.`);
      e.target.value = '';
      return;
    }
    setImageFiles((prev) => [...prev, ...files]);
    e.target.value = ''; // reset input so selecting the same file again still triggers onChange
  };

  const uploadImages = async (productId) => {
    if (imageFiles.length === 0) return;
    const formData = new FormData();
    imageFiles.forEach((f) => formData.append('files', f));

    const { supabase } = await import('../../lib/supabaseClient.js');
    const { data: { session } } = await supabase.auth.getSession();
    const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    const res = await fetch(`${BASE}/api/products/${productId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Image upload failed');
    }
    setImageFiles([]);
    loadImages(productId);
  };

  const loadImages = (productId) => {
    api(`/products/${productId}/images`).then((imgs) =>
      setProductImages((prev) => ({ ...prev, [productId]: imgs }))
    );
  };

  const deleteImage = async (productId, imageId) => {
    await api(`/products/${productId}/images/${imageId}`, { method: 'DELETE' });
    loadImages(productId);
  };



  const save = async () => {
    const body = {
      ...form,
      category_id: form.category_id || null,
      price: Number(form.price),
      stock: Number(form.stock),
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean)
    };
    let productId = editingId;
    if (editingId) {
      await api(`/products/${editingId}`, { method: 'PATCH', body });
      setMsg('Product updated.');
    } else {
      const created = await api('/products', { method: 'POST', body });
      productId = created.id;
      setMsg('Product added.');
    }
    try {
      await uploadImages(productId);
    } catch (e) {
      setImageError(e.message);
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
        <label>Product Images (JPEG, PNG, GIF, or TIFF — up to 6, 5MB each)</label>
        <input
          id="product-image-input"
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.tif,.tiff"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="btn"
          onClick={() => document.getElementById('product-image-input').click()}
        >
          Choose Images
        </button>
        <p className="muted">{imageFiles.length} file(s) selected</p>
        {imageError && <p className="error">{imageError}</p>}
        {imageFiles.length > 0 && (
          <div className="chips">
            {imageFiles.map((f, i) => (
              <span key={i} className="chip">
                {f.name}
                <button type="button" onClick={() => setImageFiles(imageFiles.filter((_, idx) => idx !== i))}
                        style={{ marginLeft: '6px', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
              </span>
            ))}
          </div>
        )}

        

        
        <button className="btn" onClick={save}>{editingId ? 'Update' : 'Add'} Product</button>
        {editingId && <button className="btn-link" onClick={() => { setEditingId(null); setForm(EMPTY); }}>Cancel edit</button>}
        {msg && <p className="success">{msg}</p>}
      </div>

      <h2>All Products</h2>
      {products.map((p) => (
        <div className="card" key={p.id}>
          
          <h3>{p.name} — ₹{p.price} · stock {p.stock} · {p.sold_count} sold</h3>
          <div>
            {productImages[p.id]?.map((img) => (
              <span key={img.id} style={{ display: 'inline-block', margin: '4px' }}>
                <img src={img.image_url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                <button className="btn-link danger" onClick={() => deleteImage(p.id, img.id)}> × </button>
              </span>
            ))}
          </div>
          <p className="muted">{categoryName(p.category_id)}</p>
          <p className="muted">{p.sizes.join(' / ') || 'No sizes'} · {p.colors.join(' / ') || 'No colors'}</p>
          <button className="btn-link" onClick={() => edit(p)}>Edit</button>
          <button className="btn-link danger" onClick={() => remove(p.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}