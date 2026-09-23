// Cart context: holds the logged-in user's cart and functions to change it.
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    api('/cart').then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const addToCart = async (product_id, size = '', color = '', quantity = 1) => {
    await api('/cart', { method: 'POST', body: { product_id, size, color, quantity } });
    refresh();
  };

  const updateQuantity = async (cartItemId, quantity) => {
    await api(`/cart/${cartItemId}`, { method: 'PATCH', body: { quantity } });
    refresh();
  };

  const removeFromCart = async (cartItemId) => {
    await api(`/cart/${cartItemId}`, { method: 'DELETE' });
    refresh();
  };

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, count, refresh, addToCart, updateQuantity, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);