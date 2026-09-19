import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function Home() {
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api('/settings').then(setSettings).catch(() => {});
    api('/products').then(setProducts).catch(() => {});
  }, []);

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
      <h2>Products</h2>
      <div className="grid">
        {products.map((p) => (
          <Link to={`/product/${p.id}`} key={p.id} className="card">
            {p.image_url && <img src={p.image_url} alt={p.name} />}
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
