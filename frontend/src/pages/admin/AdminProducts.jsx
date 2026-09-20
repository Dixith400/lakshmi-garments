import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Package, Trash2, Pencil, X, Upload } from 'lucide-react';

const EMPTY = {
  name: '', description: '', category_id: '', price: 0, stock: 0,
  sizes: '', colors: '', image_url: ''
};

const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff'];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [productImages, setProductImages] = useState({});
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
    e.target.value = '';
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
    setForm({
      ...p,
      category_id: p.category_id || '',
      sizes: (p.sizes || []).join(', '),
      colors: (p.colors || []).join(', ')
    });
    setEditingId(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await api(`/products/${id}`, { method: 'DELETE' }); load();
  };

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || 'Uncategorized';

  const inputClass = "w-full bg-ivory rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-xl font-serif font-bold text-ink mb-4 flex items-center gap-2">
        <Package size={20} /> {editingId ? 'Edit Product' : 'Add Product'}
      </h2>

      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3 mb-8">
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Product Name</label>
          <input placeholder="e.g. Silk Saree - Red" value={form.name} onChange={set('name')} className={inputClass} />
        </div>

        <div>
          <label className="text-xs text-ink/50 mb-1 block">Description</label>
          <textarea placeholder="Short description shown on the product page" value={form.description} onChange={set('description')} className={inputClass + " min-h-[70px]"} />
        </div>

        <div>
          <label className="text-xs text-ink/50 mb-1 block">Category</label>
          <select value={form.category_id} onChange={set('category_id')} className={inputClass}>
            <option value="">-- No category --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Price (₹)</label>
            <input type="number" placeholder="e.g. 1499" value={form.price} onChange={set('price')} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Stock</label>
            <input type="number" placeholder="e.g. 20" value={form.stock} onChange={set('stock')} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Sizes (optional)</label>
            <input placeholder="e.g. XL, M, S" value={form.sizes} onChange={set('sizes')} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Colors (optional)</label>
            <input placeholder="e.g. Red, Blue" value={form.colors} onChange={set('colors')} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="text-xs text-ink/50 mb-1 block">Image URL (legacy fallback — optional)</label>
          <input placeholder="https://..." value={form.image_url} onChange={set('image_url')} className={inputClass} />
        </div>

        <div>
          <label className="text-xs text-ink/50 mb-1 block">Product Images (JPEG, PNG, GIF, or TIFF — up to 6, 5MB each)</label>
          <input id="product-image-input" type="file" accept=".jpg,.jpeg,.png,.gif,.tif,.tiff" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
          <button
            type="button"
            onClick={() => document.getElementById('product-image-input').click()}
            className="flex items-center gap-2 bg-ivory text-ink font-medium text-sm px-4 py-2.5 rounded-xl hover:shadow-sm transition-shadow"
          >
            <Upload size={16} /> Choose Images
          </button>
          {imageError && <p className="text-red-600 text-sm mt-1">{imageError}</p>}
          {imageFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {imageFiles.map((f, i) => (
                <span key={i} className="flex items-center gap-1.5 bg-ivory text-ink text-xs px-3 py-1.5 rounded-full">
                  {f.name}
                  <button type="button" onClick={() => setImageFiles(imageFiles.filter((_, idx) => idx !== i))} className="text-ink/50 hover:text-red-600">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button onClick={save} className="w-full bg-brand text-white font-semibold py-2.5 rounded-full hover:bg-brand-dark transition-colors">
          {editingId ? 'Update' : 'Add'} Product
        </button>
        {editingId && (
          <button onClick={() => { setEditingId(null); setForm(EMPTY); }} className="w-full text-ink/60 text-sm py-1">
            Cancel edit
          </button>
        )}
        {msg && <p className="text-green-700 text-sm text-center">{msg}</p>}
      </div>

      <h3 className="text-lg font-serif font-semibold text-ink mb-3">All Products</h3>
      <div className="space-y-4">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-ink">{p.name} — ₹{p.price}</h3>
                <p className="text-sm text-ink/50">stock {p.stock} · {p.sold_count} sold</p>
                <p className="text-sm text-ink/50">{categoryName(p.category_id)}</p>
                <p className="text-sm text-ink/50">{p.sizes.join(' / ') || 'No sizes'} · {p.colors.join(' / ') || 'No colors'}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => edit(p)} className="text-ink/50 hover:text-brand p-1.5">
                  <Pencil size={16} />
                </button>
                <button onClick={() => remove(p.id)} className="text-red-500 hover:text-red-700 p-1.5">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {productImages[p.id]?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {productImages[p.id].map((img) => (
                  <div key={img.id} className="relative">
                    <img src={img.image_url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    <button
                      onClick={() => deleteImage(p.id, img.id)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}