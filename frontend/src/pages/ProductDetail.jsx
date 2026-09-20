import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Minus, Plus, MapPin, ShieldCheck } from 'lucide-react';

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

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/products/${id}`).then(setProduct).catch(() => {});
    api(`/products/${id}/images`).then(setImages).catch(() => {});
  }, [id]);

  useEffect(() => {
    api('/addresses').then((addrs) => {
      setAddresses(addrs);
      if (addrs.length > 0) setAddressId(addrs[0].id);
    }).catch(() => {});
  }, []);

  if (!product) return <p className="max-w-4xl mx-auto px-4 py-10 text-ink/60">Loading…</p>;

  const gallery = images.length > 0 ? images.map((i) => i.image_url) : (product.image_url ? [product.image_url] : []);

  const placeOrder = async () => {
    setError(''); setMsg(''); setBusy(true);
    try {
      if (product.sizes.length > 0 && !size) { setError('Please pick a size.'); setBusy(false); return; }
      if (product.colors.length > 0 && !color) { setError('Please pick a color.'); setBusy(false); return; }
      if (!addressId) { setError('Please add and select a shipping address first.'); setBusy(false); return; }

      const res = await api('/orders', {
        method: 'POST',
        body: { product_id: product.id, size, color, quantity: qty, address_id: addressId }
      });

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
            const done = await api('/payments/verify', {
              method: 'POST',
              body: {
                internal_order_id: res.order.id,
                razorpay_order_id: r.razorpay_order_id,
                razorpay_payment_id: r.razorpay_payment_id,
                razorpay_signature: r.razorpay_signature
              }
            });
            setMsg(`Payment successful! ${done.product.sold_count} pieces of "${product.name}" sold so far.`);
          } catch (e) { setError(e.message); }
        }
      });
      rzp.open();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Gallery */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden aspect-square">
            {gallery.length > 0 ? (
              <img src={gallery[activeImage]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink/30">No image</div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {gallery.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 ring-2 ${i === activeImage ? 'ring-brand' : 'ring-transparent'}`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h2 className="text-2xl font-serif font-bold text-ink">{product.name}</h2>
          <p className="text-ink/60 mt-1">{product.description}</p>
          <p className="text-brand text-2xl font-bold mt-3">₹{product.price}</p>
          <p className="text-ink/50 text-sm mt-1">
            {product.stock} in stock · {product.sold_count} sold
          </p>

          <div className="mt-5 space-y-4">
            {product.sizes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-ink mb-1.5">Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${s === size ? 'bg-brand text-white' : 'bg-white text-ink/70 shadow-sm'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-ink mb-1.5">Color</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${c === color ? 'bg-brand text-white' : 'bg-white text-ink/70 shadow-sm'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-ink mb-1.5">Quantity</p>
              <div className="flex items-center gap-3 bg-white rounded-full shadow-sm w-fit px-2 py-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-1.5 text-ink/60 hover:text-brand">
                  <Minus size={16} />
                </button>
                <span className="w-6 text-center font-medium">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="p-1.5 text-ink/60 hover:text-brand">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-ink mb-1.5 flex items-center gap-1.5">
                <MapPin size={15} /> Shipping Address
              </p>
              {addresses.length === 0 ? (
                <p className="text-sm text-ink/60 bg-white rounded-xl shadow-sm p-3">
                  No saved addresses. <Link to="/addresses" className="text-brand font-medium underline">Add one here</Link> before ordering.
                </p>
              ) : (
                <select
                  value={addressId}
                  onChange={(e) => setAddressId(e.target.value)}
                  className="w-full bg-white rounded-xl shadow-sm px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.addressee_name} — {a.address_line1}, {a.city} ({a.pin_code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <p className="flex items-center gap-1.5 text-sm text-ink/50">
              <ShieldCheck size={15} /> Secure online payment via Razorpay
            </p>

            <button
              onClick={placeOrder}
              disabled={busy || product.stock === 0}
              className="w-full bg-brand text-white font-semibold py-3 rounded-full hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {busy ? 'Placing…' : product.stock === 0 ? 'Sold out' : 'Pay & Place Order'}
            </button>

            {msg && <p className="text-green-700 text-sm">{msg}</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}