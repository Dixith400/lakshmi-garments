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
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api(`/products/${id}`).then(setProduct).catch(() => {}); }, [id]);
  if (!product) return <p className="page">Loading…</p>;

  const placeOrder = async () => {
    setError(''); setMsg(''); setBusy(true);
    try {
      if (!size || !color) { setError('Please pick a size and a color.'); setBusy(false); return; }

      const res = await api('/orders', {
        method: 'POST',
        body: { product_id: product.id, size, color, quantity: qty, payment_method: paymentMethod }
      });

      if (paymentMethod === 'razorpay') {
        const ok = await loadRazorpay();
        if (!ok) throw new Error('Could not load Razorpay.');
        const rzp = new window.Razorpay({
          key: res.razorpay.key_id,
          amount: res.razorpay.amount,          // in paise
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
      } else {
        setMsg(`Order placed (Cash on Delivery)! ${res.product.sold_count} pieces of "${product.name}" sold so far.`);
      }
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  return (
    <div className="page">
      <h2>{product.name}</h2>
      {product.image_url && <img src={product.image_url} alt={product.name} className="hero-img" />}
      <p>{product.description}</p>
      <p className="price">₹{product.price}</p>
      <p className="muted">{product.stock} in stock · {product.sold_count} sold</p>

      <div className="form">
        <label>Size</label>
        <div className="chips">
          {product.sizes.map((s) => (
            <button key={s} className={s === size ? 'chip active' : 'chip'} onClick={() => setSize(s)}>{s}</button>
          ))}
        </div>
        <label>Color</label>
        <div className="chips">
          {product.colors.map((c) => (
            <button key={c} className={c === color ? 'chip active' : 'chip'} onClick={() => setColor(c)}>{c}</button>
          ))}
        </div>
        <label>Quantity</label>
        <input type="number" min="1" max={product.stock} value={qty}
               onChange={(e) => setQty(Number(e.target.value))} />
        <label>Payment</label>
        <div className="chips">
          <button className={paymentMethod === 'cod' ? 'chip active' : 'chip'}
                  onClick={() => setPaymentMethod('cod')}>Cash on Delivery</button>
          <button className={paymentMethod === 'razorpay' ? 'chip active' : 'chip'}
                  onClick={() => setPaymentMethod('razorpay')}>Razorpay (Online)</button>
        </div>
        <button className="btn" onClick={placeOrder} disabled={busy || product.stock === 0}>
          {busy ? 'Placing…' : product.stock === 0 ? 'Sold out' : 'Place Order'}
        </button>
        {msg && <p className="success">{msg}</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
