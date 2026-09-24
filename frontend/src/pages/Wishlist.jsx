import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useWishlist } from '../lib/wishlist.jsx';
import { useCart } from '../lib/cart.jsx';
import { Heart, ShoppingCart } from 'lucide-react';

export default function Wishlist() {
  const { items, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [productImages, setProductImages] = useState({}); // NEW

  // NEW: fetch product image gallery, same as Home.jsx
  useEffect(() => {
    items.forEach((i) => {
      if (productImages[i.product.id]) return;
      api(`/products/${i.product.id}/images`).then((imgs) =>
        setProductImages((prev) => ({ ...prev, [i.product.id]: imgs }))
      ).catch(() => {});
    });
  }, [items]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-xl font-serif font-bold text-ink mb-5 flex items-center gap-2">
        <Heart size={20} /> My Wishlist
      </h2>

      {items.length === 0 ? (
        <p className="text-ink/50 text-center py-10">
          Nothing saved yet. <Link to="/" className="text-brand underline">Browse products</Link>
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((i) => {
            const img = productImages[i.product.id]?.[0]?.image_url || i.product.image_url;
            return (
              <div key={i.id} className="relative bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleWishlist(i.product.id)}
                  className="absolute top-2 right-2 z-10 bg-white/90 rounded-full p-1.5 shadow-sm"
                >
                  <Heart size={16} className="fill-red-500 text-red-500" />
                </button>
                <Link to={`/product/${i.product.id}`}>
                  {img && (
                    <img src={img} alt={i.product.name} className="w-full h-36 object-cover" />
                  )}
                  <div className="p-3">
                    <h3 className="font-medium text-ink text-sm truncate">{i.product.name}</h3>
                    <p className="text-brand font-bold">₹{i.product.price}</p>
                    <p className="text-ink/50 text-xs">
                      {i.product.stock > 0 ? `${i.product.stock} in stock` : 'Sold out'} · {i.product.sold_count} sold
                    </p>
                  </div>
                </Link>
              {i.product.stock > 0 && (
                i.product.sizes?.length === 0 && i.product.colors?.length === 0 ? (
                  <button
                    onClick={() => addToCart(i.product.id, '', '', 1)}
                    className="w-full flex items-center justify-center gap-1.5 bg-brand/10 text-brand text-xs font-semibold py-2 hover:bg-brand/20 transition-colors"
                  >
                    <ShoppingCart size={13} /> Add to Cart
                  </button>
                ) : (
                  <Link
                    to={`/product/${i.product.id}`}
                    className="w-full flex items-center justify-center gap-1.5 bg-brand/10 text-brand text-xs font-semibold py-2 hover:bg-brand/20 transition-colors"
                  >
                    <ShoppingCart size={13} /> Add to Cart
                  </Link>
                )
              )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}