// src/components/Auth0RedirectHandler.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';

// This component handles redirects after Auth0 authentication
const Auth0RedirectHandler = () => {
  const { isAuthenticated, firebaseUser, isLoading } = useAuthContext();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Only process after authentication and loading are complete
    if (isLoading) return;
    
    if (isAuthenticated) {
      // If we have firebaseUser data, use it to determine the redirect
      if (firebaseUser) {
        if (firebaseUser.userType === 'vendor') {
          navigate('/vendor-dashboard');
        } else {
          navigate('/profile');
        }
      } else {
        // If authenticated but no firebaseUser, redirect to appropriate signup
        // This could happen if Auth0 authentication succeeded but the user
        // hasn't completed their profile in Firestore yet
        navigate('/complete-profile');
      }
    }
  }, [isAuthenticated, firebaseUser, isLoading, navigate]);
  
  // Render a loading state while processing
  return (
    <div className="redirect-handler">
      <div className="loading-spinner"></div>
      <p>Setting up your account...</p>
    </div>
  );
};

export default Auth0RedirectHandler;