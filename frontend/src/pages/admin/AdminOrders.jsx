import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { ClipboardList, MapPin } from 'lucide-react';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const load = () => api('/orders/all').then(setOrders).catch(() => {});
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    await api(`/orders/${id}/status`, { method: 'PATCH', body: { status } });
    load();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-xl font-serif font-bold text-ink mb-5 flex items-center gap-2">
        <ClipboardList size={20} /> All Orders
      </h2>

      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-ink">Order {o.id.slice(0, 8)}</p>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-700'}`}>
                {o.status}
              </span>
            </div>
            <p className="text-sm text-ink/70">₹{o.total} · Online Payment · payment: {o.payment_status}</p>
            <p className="text-sm text-ink/70">Customer: {o.user_email || o.user_id}</p>

            <ul className="mt-3 space-y-2">
              {(o.items || []).map((it, i) => (
                <li key={i} className="flex items-center gap-3">
                  {it.image_url && (
                    <img src={it.image_url} alt={it.product_name} className="w-12 h-12 object-cover rounded-lg shrink-0" />
                  )}
                  <span className="text-sm text-ink/60">
                    {it.product_name} — {it.size} / {it.color} × {it.quantity}
                  </span>
                </li>
              ))}
            </ul>

            {o.shipping_address && (
              <p className="mt-2 text-sm text-ink/60 flex items-start gap-1.5">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                {o.shipping_address.addressee_name}, {o.shipping_address.address_line1},{' '}
                {o.shipping_address.city}, {o.shipping_address.state} - {o.shipping_address.pin_code}
              </p>
            )}

            <div className="flex gap-2 mt-3">
              <button onClick={() => setStatus(o.id, 'confirmed')} className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100">
                Confirm
              </button>
              <button onClick={() => setStatus(o.id, 'delivered')} className="text-xs font-medium bg-green-50 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-100">
                Delivered
              </button>
              <button onClick={() => setStatus(o.id, 'cancelled')} className="text-xs font-medium bg-red-50 text-red-700 px-3 py-1.5 rounded-full hover:bg-red-100">
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}