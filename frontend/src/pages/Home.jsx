import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function Home() {
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productImages, setProductImages] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api('/settings').then(setSettings).catch(() => {});
    api('/products').then((prods) => {
      setProducts(prods);
      prods.forEach((p) => {
        api(`/products/${p.id}/images`).then((imgs) =>
          setProductImages((prev) => ({ ...prev, [p.id]: imgs }))
        );
      });
    }).catch(() => {});
    api('/categories').then(setCategories).catch(() => {});
  }, []);

  const filtered = products.filter((p) => {
    const matchesCategory = !activeCategory || p.category_id === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="page">
      {settings && (
        <header className="shop-header">
          <img src={settings.logo_url} alt="logo" className="logo" />
          <div>
            <h1>{settings.shop_name}</h1>
            <p>{settings.address}</p>
            <p>Phone: {settings.phone}</p>
          </div>
        </header>
      )}

      <div className="form" style={{ maxWidth: '100%' }}>
        <input placeholder="Search products…" value={search}
               onChange={(e) => setSearch(e.target.value)} />
      </div>

      <button className="btn-link" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '▲ Hide categories' : '▼ Show categories'}
      </button>

      {sidebarOpen && (
        <div className="chips" style={{ margin: '10px 0' }}>
          <button className={!activeCategory ? 'chip active' : 'chip'}
                  onClick={() => setActiveCategory(null)}>All</button>
          {categories.map((c) => (
            <button key={c.id} className={activeCategory === c.id ? 'chip active' : 'chip'}
                    onClick={() => setActiveCategory(c.id)}>{c.name}</button>
          ))}
        </div>
      )}

      <h2>Products</h2>
      <div className="grid">
        {filtered.map((p) => (
          <Link to={`/product/${p.id}`} key={p.id} className="card">
            {(productImages[p.id]?.[0]?.image_url || p.image_url) && (
              <img src={productImages[p.id]?.[0]?.image_url || p.image_url} alt={p.name} />
            )}
            <h3>{p.name}</h3>
            <p className="price">₹{p.price}</p>
            <p className="muted">
              {p.stock > 0 ? `${p.stock} in stock` : 'Sold out'} · {p.sold_count} sold
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}