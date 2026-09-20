import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import MyOrders from './pages/MyOrders.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import ShopSettings from './pages/admin/ShopSettings.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="page">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnly({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <p className="page">Admins only.</p>;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:id" element={<Protected><ProductDetail /></Protected>} />
        <Route path="/my-orders" element={<Protected><MyOrders /></Protected>} />
        <Route path="/admin/products" element={<AdminOnly><AdminProducts /></AdminOnly>} />
        <Route path="/admin/orders" element={<AdminOnly><AdminOrders /></AdminOnly>} />
        <Route path="/admin/shop-details" element={<AdminOnly><ShopSettings /></AdminOnly>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin/categories" element={<AdminOnly><AdminCategories /></AdminOnly>} />
      </Routes>
    </AuthProvider>
  );
}
