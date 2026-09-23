import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../lib/cart.jsx';
import { api } from '../lib/api.js';
import { Minus, Plus, Trash2, ShoppingCart, MapPin } from 'lucide-react';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Cart() {
  const { items, loading, updateQuantity, removeFromCart, refresh } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
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

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const checkout = async () => {
    setError(''); setMsg(''); setBusy(true);
    try {
      if (!addressId) { setError('Please add and select a shipping address first.'); setBusy(false); return; }

      const res = await api(`/orders/checkout-cart?address_id=${addressId}`, { method: 'POST' });

      const ok = await loadRazorpay();
      if (!ok) throw new Error('Could not load Razorpay.');
      const rzp = new window.Razorpay({
        key: res.razorpay.key_id,
        amount: res.razorpay.amount,
        currency: 'INR',
        name: 'Lakshmi Garments & Jewelry',
        order_id: res.razorpay.razorpay_order_id,
        handler: async (r) => {
          try {
            await api('/payments/verify', {
              method: 'POST',
              body: {
                internal_order_id: res.order.id,
                razorpay_order_id: r.razorpay_order_id,
                razorpay_payment_id: r.razorpay_payment_id,
                razorpay_signature: r.razorpay_signature
              }
            });
            setMsg('Payment successful! Your order has been placed.');
            refresh();
            setTimeout(() => navigate('/my-orders'), 1500);
          } catch (e) { setError(e.message); }
        }
      });
      rzp.open();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

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
            {items.map((i) => (
              <div key={i.id} className="bg-white rounded-2xl shadow-sm p-4 flex gap-4 items-center">
                {i.product.image_url && (
                  <img src={i.product.image_url} alt="" className="w-16 h-16 object-cover rounded-xl shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">{i.product.name}</p>
                  <p className="text-sm text-ink/50">
                    {[i.size, i.color].filter(Boolean).join(' / ') || 'No variant'}
                  </p>
                  <p className="text-brand font-bold">₹{i.product.price}</p>
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
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <div>
              <p className="text-sm font-medium text-ink mb-1.5 flex items-center gap-1.5">
                <MapPin size={15} /> Shipping Address
              </p>
              {addresses.length === 0 ? (
                <p className="text-sm text-ink/60">
                  No saved addresses. <Link to="/addresses" className="text-brand font-medium underline">Add one here</Link> before checking out.
                </p>
              ) : (
                <select
                  value={addressId}
                  onChange={(e) => setAddressId(e.target.value)}
                  className="w-full bg-ivory rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.addressee_name} — {a.address_line1}, {a.city} ({a.pin_code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-between text-lg font-bold text-ink pt-2 border-t border-ink/10">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <button
              onClick={checkout}
              disabled={busy}
              className="w-full bg-brand text-white font-semibold py-3 rounded-full hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {busy ? 'Placing…' : 'Checkout & Pay'}
            </button>

            {msg && <p className="text-green-700 text-sm">{msg}</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}