// src/pages/UserSignupPage.js
import React from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { UserSignup } from '../components/UserSignup';
import { Navigate } from 'react-router-dom';

const UserSignupPage = () => {
  const { isAuthenticated, firebaseUser, isLoading } = useAuthContext();

  // Redirect to profile if already logged in
  if (isAuthenticated && firebaseUser && !isLoading) {
    return <Navigate to="/profile" />;
  }

  return (
    <div>
      <UserSignup />
    </div>
  );
};

export default UserSignupPage;