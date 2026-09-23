// Wishlist context: holds the logged-in user's saved (hearted) products.
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.jsx';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const refresh = useCallback(() => {
    if (!user) { setItems([]); return; }
    api('/wishlist').then(setItems).catch(() => {});
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const isWishlisted = (productId) => items.some((i) => i.product_id === productId);

  const toggleWishlist = async (productId) => {
    if (isWishlisted(productId)) {
      await api(`/wishlist/${productId}`, { method: 'DELETE' });
    } else {
      await api('/wishlist', { method: 'POST', body: { product_id: productId } });
    }
    refresh();
  };

  return (
    <WishlistContext.Provider value={{ items, count: items.length, isWishlisted, toggleWishlist, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);