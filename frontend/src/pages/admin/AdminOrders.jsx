import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const load = () => api('/orders/all').then(setOrders).catch(() => {});
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    await api(`/orders/${id}/status`, { method: 'PATCH', body: { status } });
    load();
  };

  return (
    <div className="page">
      <h2>All Orders</h2>
      {orders.map((o) => (
        <div className="card" key={o.id}>
          <p><b>Order {o.id.slice(0, 8)}</b> · ₹{o.total} · Online Payment · payment: {o.payment_status}</p>
          <p>Status: {o.status} · Customer: {o.user_email || o.user_id}</p>
          <ul>
            {(o.items || []).map((it, i) => (
              <li key={i}>{it.product_name} — {it.size} / {it.color} × {it.quantity}</li>
            ))}
          </ul>
          <button className="btn-link" onClick={() => setStatus(o.id, 'confirmed')}>Confirm</button>
          <button className="btn-link" onClick={() => setStatus(o.id, 'delivered')}>Delivered</button>
          <button className="btn-link danger" onClick={() => setStatus(o.id, 'cancelled')}>Cancel</button>
          {o.shipping_address && (
            <p className="muted">
              Ship to: {o.shipping_address.addressee_name}, {o.shipping_address.address_line1},{' '}
              {o.shipping_address.city}, {o.shipping_address.state} - {o.shipping_address.pin_code}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
