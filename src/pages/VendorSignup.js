// src/components/VendorSignup.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthContext } from '../hooks/useAuthContext';
import './Signup.css';
import googleIcon from '../assets/google-icon.svg';

// Business categories for the dropdown
const BUSINESS_CATEGORIES = [
  'Fashion & Apparel',
  'Electronics & Gadgets',
  'Home & Kitchen',
  'Beauty & Personal Care',
  'Food & Beverages',
  'Health & Wellness',
  'Arts & Crafts',
  'Books & Stationery',
  'Toys & Games',
  'Sports & Outdoors',
  'Other'
];

const VendorSignup = () => {
  const { login, isAuthenticated, user, dispatch } = useAuthContext();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    userName: '',
    phoneNumber: '',
    email: '',
    shopName: '',
    category: '',
    description: ''
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
      
      // Add vendor to Firestore
      const vendorData = {
        userName: formData.userName,
        phoneNumber: formData.phoneNumber,
        email: userEmail,
        shopName: formData.shopName,
        category: formData.category,
        description: formData.description,
        userType: 'vendor',
        createdAt: new Date(),
        approved: false // Vendors might need approval before listing products
      };
      
      const docRef = await addDoc(collection(db, 'users'), vendorData);
      
      // Important: Update AuthContext with the new Firebase user data
      const newVendorData = {
        id: docRef.id,
        ...vendorData
      };
      
      // Update the AuthContext with the Firestore user
      dispatch({ type: 'SET_FIREBASE_USER', payload: newVendorData });
      
      // If not already authenticated via Auth0, update the user state too
      if (!isAuthenticated) {
        dispatch({ type: 'LOGIN', payload: { email: userEmail } });
      }
      
      // Navigate to vendor dashboard
      navigate('/vendor-dashboard');
    } catch (err) {
      console.error('Error creating vendor account:', err);
      setError('Failed to create vendor account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleSignup = () => {
    login({
      connection: 'google-oauth2',
      redirect_uri: `${window.location.origin}/vendor-dashboard`
    });
  };
  
  return (
    <div className="signup-container vendor">
      <div className="signup-card">
        <div className="signup-header">
          <h2>Become a RiSU Vend Seller</h2>
          <p>Sign up to start selling your products</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="userName">Contact Person Name</label>
              <input
                type="text"
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                placeholder="Enter your name"
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
                placeholder="Enter business phone number"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Business Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your business email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="shopName">Shop Name</label>
            <input
              type="text"
              id="shopName"
              name="shopName"
              value={formData.shopName}
              onChange={handleChange}
              placeholder="Enter your shop name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Business Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select your business category</option>
              {BUSINESS_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Shop Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell us about your business and products..."
              rows="4"
              required
            ></textarea>
          </div>
          
          <button 
            type="submit" 
            className="primary-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Vendor Account'}
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
          <p>Already have a vendor account? <a href="/vendor-login">Log In</a></p>
          <p>Want to shop on RiSU Vend? <a href="/signup">Sign up as a Customer</a></p>
        </div>
      </div>
    </div>
  );
};

export default VendorSignup;