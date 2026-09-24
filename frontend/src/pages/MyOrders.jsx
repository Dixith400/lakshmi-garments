import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Package, MapPin } from 'lucide-react';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api('/orders').then(setOrders).catch(() => {}); }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-xl font-serif font-bold text-ink mb-5 flex items-center gap-2">
        <Package size={20} /> My Orders
      </h2>

      {orders.length === 0 && (
        <p className="text-ink/50 text-center py-10">No orders yet.</p>
      )}

      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-ink/50">{new Date(o.created_at).toLocaleString()}</p>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-700'}`}>
                {o.status}
              </span>
            </div>

            <p className="text-ink font-semibold">₹{o.total} · Online Payment ({o.payment_status})</p>

            <ul className="mt-3 space-y-2">
              {(o.items || []).map((it, i) => (
                <li key={i} className="flex items-center gap-3">
                  {it.image_url && (
                    <img src={it.image_url} alt={it.product_name} className="w-12 h-12 object-cover rounded-lg shrink-0" />
                  )}
                  <span className="text-sm text-ink/70">
                    {it.product_name} — {it.size} / {it.color} × {it.quantity} @ ₹{it.unit_price}
                  </span>
                </li>
              ))}
            </ul>

            {o.shipping_address && (
              <p className="mt-3 text-sm text-ink/60 flex items-start gap-1.5">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                {o.shipping_address.addressee_name}, {o.shipping_address.address_line1},{' '}
                {o.shipping_address.city}, {o.shipping_address.state} - {o.shipping_address.pin_code}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}