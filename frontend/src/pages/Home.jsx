import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

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
    <div className="max-w-6xl mx-auto px-4 py-6">
      {settings && (
        <header className="flex flex-col sm:flex-row items-center gap-4 bg-white rounded-2xl shadow-sm p-5 mb-6">
          <img src={settings.logo_url} alt="logo" className="w-20 h-20 object-contain rounded-2xl" />
          <div className="text-center sm:text-left">
            <h1 className="text-xl font-serif font-bold text-brand">{settings.shop_name}</h1>
            <p className="text-ink/70 text-sm">{settings.address}</p>
            <p className="text-ink/70 text-sm">Phone: {settings.phone}</p>
          </div>
        </header>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white rounded-full pl-10 pr-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <button
          className="flex items-center justify-center gap-1.5 text-brand font-medium text-sm bg-white rounded-full px-4 py-2.5 shadow-sm whitespace-nowrap"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          Categories {sidebarOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {sidebarOpen && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!activeCategory ? 'bg-brand text-white' : 'bg-white text-ink/70 shadow-sm'}`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === c.id ? 'bg-brand text-white' : 'bg-white text-ink/70 shadow-sm'}`}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <h2 className="text-lg font-serif font-semibold text-ink mb-3">Products</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map((p) => (
          <Link
            to={`/product/${p.id}`}
            key={p.id}
            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            {(productImages[p.id]?.[0]?.image_url || p.image_url) && (
              <img
                src={productImages[p.id]?.[0]?.image_url || p.image_url}
                alt={p.name}
                className="w-full h-36 object-cover"
              />
            )}
            <div className="p-3">
              <h3 className="font-medium text-ink text-sm truncate">{p.name}</h3>
              <p className="text-brand font-bold">₹{p.price}</p>
              <p className="text-ink/50 text-xs">
                {p.stock > 0 ? `${p.stock} in stock` : 'Sold out'} · {p.sold_count} sold
              </p>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-ink/50 py-8">No products found.</p>
        )}
      </div>
    </div>
  );
}