import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api('/orders').then(setOrders).catch(() => {}); }, []);

  return (
    <div className="page">
      <h2>My Orders</h2>
      {orders.map((o) => (
        <div className="card" key={o.id}>
          <p><b>{new Date(o.created_at).toLocaleString()}</b></p>
          <p>Total: ₹{o.total} · {o.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}</p>
          <p>Status: {o.status} · Payment: {o.payment_status}</p>
          <ul>
            {(o.items || []).map((it, i) => (
              <li key={i}>{it.product_name} — {it.size} / {it.color} × {it.quantity} @ ₹{it.unit_price}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
