// src/pages/VendorSignupPage.js 
import React from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { VendorSignup } from '../components/VendorSignup';
import { Navigate } from 'react-router-dom';

const VendorSignupPage = () => {
  const { isAuthenticated, firebaseUser, isLoading } = useAuthContext();

  // Redirect to vendor profile if already logged in as vendor
  if (isAuthenticated && firebaseUser && !isLoading) {
    return <Navigate to="/vendor-dashboard" />;
  }

  return (
    <div>
      <VendorSignup />
    </div>
  );
};

export default VendorSignupPage;