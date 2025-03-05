// src/components/UserSignup.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthContext } from '../hooks/useAuthContext';
import './Signup.css';
import googleIcon from '../assets/google-icon.svg';

const UserSignup = () => {
  const { login, isAuthenticated, user, dispatch } = useAuthContext();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    userName: '',
    phoneNumber: '',
    email: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Use Auth0 user email if authenticated
      const userEmail = isAuthenticated ? user.email : formData.email;
      
      // Add user to Firestore
      const docRef = await addDoc(collection(db, 'users'), {
        userName: formData.userName,
        phoneNumber: formData.phoneNumber,
        email: userEmail,
        userType: 'customer',
        createdAt: new Date()
      });
      
      // Important: Update AuthContext with the new Firebase user data
      const newUserData = {
        id: docRef.id,
        userName: formData.userName,
        phoneNumber: formData.phoneNumber,
        email: userEmail,
        userType: 'customer'
      };
      
      // Update the AuthContext with the Firestore user
      dispatch({ type: 'SET_FIREBASE_USER', payload: newUserData });
      
      // If not already authenticated via Auth0, update the user state too
      if (!isAuthenticated) {
        dispatch({ type: 'LOGIN', payload: { email: userEmail } });
      }
      
      // Navigate to profile page
      navigate('/profile');
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleSignup = () => {
    // We'll rely on the Auth0 redirect flow to handle the authentication
    login({
      connection: 'google-oauth2',
      redirect_uri: `${window.location.origin}/profile`
    });
  };
  
  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h2>Join RiSU Vend</h2>
          <p>Sign up as a customer to start shopping</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="userName">Username</label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="primary-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="divider">
          <span>or</span>
        </div>
        
        <button 
          onClick={handleGoogleSignup} 
          className="google-button"
        >
          <img src={googleIcon} alt="Google" />
          <span>Sign up with Google</span>
        </button>
        
        <div className="signup-footer">
          <p>Already have an account? <a href="/login">Log In</a></p>
          <p>Want to sell on RiSU Vend? <a href="/vendor-signup">Sign up as a Vendor</a></p>
        </div>
      </div>
    </div>
  );
};

export default UserSignup;