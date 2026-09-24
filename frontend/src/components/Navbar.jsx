import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Menu, X, Package, MapPin, Tag, ClipboardList, Store, LogIn, LogOut, ShoppingCart, Heart, HelpCircle } from 'lucide-react';
import { useCart } from '../lib/cart.jsx';
import { useWishlist } from '../lib/wishlist.jsx';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { count: cartCount } = useCart();
  const { count: wishCount } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = "flex items-center gap-1.5 text-ivory/90 hover:text-accent transition-colors text-sm font-medium";

  return (
    <div className="sticky top-3 z-50 px-3">
      <nav className="max-w-6xl mx-auto bg-brand rounded-2xl shadow-lg">
        <div className="px-5 py-3 flex items-center justify-between">
          <Link to="/" className="font-serif font-bold text-lg text-accent tracking-wide" onClick={() => setMenuOpen(false)}>
            Lakshmi Garments &amp; Jewelry
          </Link>

          <button
            className="md:hidden text-accent"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="hidden md:flex flex-wrap gap-6 items-center">
            <Link to="/" className={linkClass}><Store size={16} /> Home</Link>
            <Link to="/help" className={linkClass}><HelpCircle size={16} /> Help</Link>
            {user && <Link to="/my-orders" className={linkClass}><ClipboardList size={16} /> My Orders</Link>}
            {user && <Link to="/addresses" className={linkClass}><MapPin size={16} /> Addresses</Link>}
            {isAdmin && <Link to="/admin/products" className={linkClass}><Package size={16} /> Products</Link>}
            {isAdmin && <Link to="/admin/categories" className={linkClass}><Tag size={16} /> Categories</Link>}
            {isAdmin && <Link to="/admin/orders" className={linkClass}><ClipboardList size={16} /> Orders</Link>}
            {isAdmin && <Link to="/admin/shop-details" className={linkClass}><Store size={16} /> Shop Details</Link>}
            {user && (
              <Link to="/wishlist" className="relative text-ivory/90 hover:text-accent transition-colors">
                <Heart size={19} />
                {wishCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-brand-dark text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{wishCount}</span>
                )}
              </Link>
            )}
            {user && (
              <Link to="/cart" className="relative text-ivory/90 hover:text-accent transition-colors">
                <ShoppingCart size={19} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-brand-dark text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>
                )}
              </Link>
            )}
            {user
              ? <button className="flex items-center gap-1.5 bg-accent text-brand-dark font-semibold text-sm px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity" onClick={logout}><LogOut size={15} /> Logout</button>
              : <Link to="/login" className="flex items-center gap-1.5 bg-accent text-brand-dark font-semibold text-sm px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity"><LogIn size={15} /> Login</Link>}
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-brand-dark rounded-b-2xl flex flex-col gap-4 px-5 py-4">
            <Link to="/" className={linkClass} onClick={() => setMenuOpen(false)}><Store size={16} /> Home</Link>
            <Link to="/help" className={linkClass} onClick={() => setMenuOpen(false)}><HelpCircle size={16} /> Help</Link>
            {user && <Link to="/my-orders" className={linkClass} onClick={() => setMenuOpen(false)}><ClipboardList size={16} /> My Orders</Link>}
            {user && <Link to="/addresses" className={linkClass} onClick={() => setMenuOpen(false)}><MapPin size={16} /> Addresses</Link>}
            {isAdmin && <Link to="/admin/products" className={linkClass} onClick={() => setMenuOpen(false)}><Package size={16} /> Products</Link>}
            {isAdmin && <Link to="/admin/categories" className={linkClass} onClick={() => setMenuOpen(false)}><Tag size={16} /> Categories</Link>}
            {isAdmin && <Link to="/admin/orders" className={linkClass} onClick={() => setMenuOpen(false)}><ClipboardList size={16} /> Orders</Link>}
            {isAdmin && <Link to="/admin/shop-details" className={linkClass} onClick={() => setMenuOpen(false)}><Store size={16} /> Shop Details</Link>}
            {user && <Link to="/wishlist" className={linkClass} onClick={() => setMenuOpen(false)}><Heart size={16} /> Wishlist ({wishCount})</Link>}
            {user && <Link to="/cart" className={linkClass} onClick={() => setMenuOpen(false)}><ShoppingCart size={16} /> Cart ({cartCount})</Link>}
            {user
              ? <button className="flex items-center gap-1.5 bg-accent text-brand-dark font-semibold text-sm px-4 py-1.5 rounded-full w-fit" onClick={() => { logout(); setMenuOpen(false); }}><LogOut size={15} /> Logout</button>
              : <Link to="/login" className="flex items-center gap-1.5 bg-accent text-brand-dark font-semibold text-sm px-4 py-1.5 rounded-full w-fit" onClick={() => setMenuOpen(false)}><LogIn size={15} /> Login</Link>}
          </div>
        )}
      </nav>
    </div>
  );
}