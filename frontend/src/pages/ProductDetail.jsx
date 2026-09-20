import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api.js';

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
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');

  useEffect(() => {
    api('/addresses').then((addrs) => {
      setAddresses(addrs);
      if (addrs.length > 0) setAddressId(addrs[0].id);
    }).catch(() => {});
  }, []);
    
  

  useEffect(() => {
    api(`/products/${id}`).then(setProduct).catch(() => {});
    api(`/products/${id}/images`).then(setImages).catch(() => {});
  }, [id]);

  useEffect(() => { api(`/products/${id}`).then(setProduct).catch(() => {}); }, [id]);
  if (!product) return <p className="page">Loading…</p>;

  const placeOrder = async () => {
    setError(''); setMsg(''); setBusy(true);
    try {
      // Only require a selection if the admin actually configured options.
      if (product.sizes.length > 0 && !size) {
        setError('Please pick a size.'); setBusy(false); return;
      }
      if (product.colors.length > 0 && !color) {
        setError('Please pick a color.'); setBusy(false); return;
      }

      if (!addressId) {
        setError('Please add and select a shipping address first.');
        setBusy(false);
        return;
      }
      // ...
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
    <div className="page">
      <h2>{product.name}</h2>


      {images.length > 0 ? (
        <div className="image-gallery">
          {images.map((img) => (
            <img key={img.id} src={img.image_url} alt={product.name} />
          ))}
        </div>
      ) : (
        product.image_url && <img src={product.image_url} alt={product.name} className="hero-img" />
      )}


      <p>{product.description}</p>
      <p className="price">₹{product.price}</p>
      <p className="muted">{product.stock} in stock · {product.sold_count} sold</p>

      <div className="form">
        {product.sizes.length > 0 && (
          <>
            <label>Size</label>
            <div className="chips">
              {product.sizes.map((s) => (
                <button key={s} className={s === size ? 'chip active' : 'chip'} onClick={() => setSize(s)}>{s}</button>
              ))}
            </div>
          </>
        )}

        {product.colors.length > 0 && (
          <>
            <label>Color</label>
            <div className="chips">
              {product.colors.map((c) => (
                <button key={c} className={c === color ? 'chip active' : 'chip'} onClick={() => setColor(c)}>{c}</button>
              ))}
            </div>
          </>
        )}
        <label>Quantity</label>
        <input type="number" min="1" max={product.stock} value={qty}
               onChange={(e) => setQty(Number(e.target.value))} />
        <label>Shipping Address</label>
        {addresses.length === 0 ? (
          <p className="muted">
            No saved addresses. <Link to="/addresses">Add one here</Link> before ordering.
          </p>
        ) : (
          <select value={addressId} onChange={(e) => setAddressId(e.target.value)}>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.addressee_name} — {a.address_line1}, {a.city} ({a.pin_code})
              </option>
            ))}
          </select>
        )}
        <p className="muted">Payment: Online (Razorpay) — secure card, UPI, or netbanking.</p>
        <button className="btn" onClick={placeOrder} disabled={busy || product.stock === 0}>
          {busy ? 'Placing…' : product.stock === 0 ? 'Sold out' : 'Pay & Place Order'}
        </button>
        {msg && <p className="success">{msg}</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
} 