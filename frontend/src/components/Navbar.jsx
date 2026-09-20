import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  return (
    <nav className="navbar">
      <Link to="/" className="brand">Lakshmi Garments &amp; Jewelry</Link>
      <div className="navlinks">
        <Link to="/">Home</Link>
        {user && <Link to="/my-orders">My Orders</Link>}
        {user && <Link to="/addresses">My Addresses</Link>}
        {isAdmin && <Link to="/admin/products">Admin · Products</Link>}
        {isAdmin && <Link to="/admin/orders">Admin · Orders</Link>}
        {isAdmin && <Link to="/admin/shop-details">Admin · Shop Details</Link>}
        {isAdmin && <Link to="/admin/categories">Admin · Categories</Link>}
        
        {user
          ? <button className="btn-link" onClick={logout}>Logout</button>
          : <Link to="/login">Login</Link>}

      </div>
    </nav>
  );
}
