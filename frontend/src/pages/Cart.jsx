import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../lib/cart.jsx';
import { api } from '../lib/api.js';
import { Minus, Plus, Trash2, ShoppingCart, MapPin } from 'lucide-react';

// ...loadRazorpay unchanged...

export default function Cart() {
  const { items, loading, updateQuantity, removeFromCart, refresh } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [productImages, setProductImages] = useState({}); // NEW
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api('/addresses').then((addrs) => {
      setAddresses(addrs);
      if (addrs.length > 0) setAddressId(addrs[0].id);
    }).catch(() => {});
  }, []);

  // NEW: fetch product image gallery, same as Home.jsx
  useEffect(() => {
    items.forEach((i) => {
      if (productImages[i.product.id]) return; // already fetched
      api(`/products/${i.product.id}/images`).then((imgs) =>
        setProductImages((prev) => ({ ...prev, [i.product.id]: imgs }))
      ).catch(() => {});
    });
  }, [items]);

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  // ...checkout unchanged...

  if (loading) return <p className="max-w-3xl mx-auto px-4 py-10 text-ink/60">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-xl font-serif font-bold text-ink mb-5 flex items-center gap-2">
        <ShoppingCart size={20} /> My Cart
      </h2>

      {items.length === 0 ? (
        <p className="text-ink/50 text-center py-10">
          Your cart is empty. <Link to="/" className="text-brand underline">Browse products</Link>
        </p>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {items.map((i) => {
              const img = productImages[i.product.id]?.[0]?.image_url || i.product.image_url;
              return (
                <Link
                  key={i.id}
                  to={`/product/${i.product.id}`}
                  className="bg-white rounded-2xl shadow-sm p-4 flex gap-4 items-center hover:shadow-md transition-shadow"
                  onClick={(e) => {
                    // let the quantity/remove buttons inside still work without navigating
                    if (e.target.closest('button')) e.preventDefault();
                  }}
                >
                  {img && (
                    <img src={img} alt="" className="w-16 h-16 object-cover rounded-xl shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">{i.product.name}</p>
                    <p className="text-sm text-ink/50">
                      {[i.size, i.color].filter(Boolean).join(' / ') || 'No variant'}
                    </p>
                    <p className="text-brand font-bold">₹{i.product.price}</p>
                    <p className="text-ink/50 text-xs">
                      {i.product.stock > 0 ? `${i.product.stock} in stock` : 'Sold out'} · {i.product.sold_count} sold
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-ivory rounded-full px-2 py-1">
                    <button onClick={() => updateQuantity(i.id, Math.max(1, i.quantity - 1))} className="p-1 text-ink/60 hover:text-brand">
                      <Minus size={14} />
                    </button>
                    <span className="w-5 text-center text-sm font-medium">{i.quantity}</span>
                    <button onClick={() => updateQuantity(i.id, Math.min(i.product.stock, i.quantity + 1))} className="p-1 text-ink/60 hover:text-brand">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(i.id)} className="text-red-500 hover:text-red-700 p-1.5 shrink-0">
                    <Trash2 size={16} />
                  </button>
                </Link>
              );
            })}
          </div>

          {/* rest (address select, total, checkout button) unchanged */}
        </>
      )}
    </div>
  );
}