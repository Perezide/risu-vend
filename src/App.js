// Updated App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthContext } from "./hooks/useAuthContext";
import React, { useState } from 'react';

// Import Pages
import Home from "./pages/Home";
import Login from "./pages/Login";

// Import Components
import Header from './components/Header';
import SideNav from './components/SideNav';
import WhatsAppChat from "./components/WhatsAppChat";
import Saved from "./pages/Saved";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";
import AdminDashboard from "./pages/AdminDashboard";

import { Toaster } from "react-hot-toast";
import ShopingCart from "./pages/ShopingCart";
import UserSignup from "./pages/UserSignup";
import VendorSignup from "./pages/VendorSignup";
import VendorDashboard from "./pages/VendorDashboard";
import Shop from "./pages/Shop";
import Checkout from "./pages/Checkout";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";

function App() {
  const { authIsReady, user } = useAuthContext();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  const toggleSideNav = () => {
    setIsSideNavOpen(!isSideNavOpen);
  };

// Protected route component
const ProtectedRoute = ({ children, requiredType }) => {
  const { firebaseUser, isLoading } = useAuthContext();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!firebaseUser) {
    return <Navigate to="/login" />;
  }
  
  if (requiredType && firebaseUser.userType !== requiredType) {
    return <Navigate to="/" />;
  }
  
  return children;
};

  const GuestRoute = ({ children }) => {
    if (!authIsReady) {
      return (
        <div className="loading-container">
          <div className="loading-spinner-overlay">
          <div className="loading-spinner"></div>
          </div>
        </div>
      );
    }

    if (user) {
      return <Navigate to="/" />;
    }

    return children;
  };

  if (!authIsReady) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-overlay">
        <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Header 
          toggleSideNav={toggleSideNav} 
        />
        <SideNav 
          isOpen={isSideNavOpen} 
          toggleSideNav={toggleSideNav}
          user={user}
        />
        <main className="">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/shop/:shopId" element={<Shop />} /> {/* Add the Shop route */}
            <Route path="/product/:productId" element={<ProductDetail />} />
            <Route path="/shopping-cart" element={<ShopingCart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
            <Route path="admin-dashboard" element={<AdminDashboard />}/>
            <Route path="/shoping-cart" element={ <ShopingCart /> } />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/saved" element={ <Saved /> }/>
            
            {/* Guest Routes */}
            <Route
              path="/user-signup"
              element={
                <GuestRoute>
                  <UserSignup />
                </GuestRoute>
              }
            />
             <Route
              path="/vendor-signup"
              element={
                <GuestRoute>
                  <VendorSignup />
                </GuestRoute>
              }
            />
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />

        {/* Protected routes */}
        <Route path="/profile" element={
          <ProtectedRoute requiredType="customer">
            <Profile />
          </ProtectedRoute>
        } />
        
        <Route path="/vendor-dashboard" element={
          <ProtectedRoute requiredType="vendor">
            <VendorDashboard />
          </ProtectedRoute>
        } />

          </Routes>
          <Toaster />
        </main>
        <WhatsAppChat />
      </div>
    </BrowserRouter>
  );
}

export default App;