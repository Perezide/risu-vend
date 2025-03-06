// src/components/VendorSignup.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
  const { signup, signInWithGoogle, user, dispatch } = useAuthContext();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    userName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
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
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Create the user with Firebase Auth
      const authUser = await signup(formData.email, formData.password);
      
      // Add vendor to Firestore
      const vendorData = {
        userName: formData.userName,
        phoneNumber: formData.phoneNumber,
        email: authUser.email,
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
      
      // Navigate to vendor dashboard
      navigate('/vendor-dashboard');
    } catch (err) {
      console.error('Error creating vendor account:', err);
      setError(err.message || 'Failed to create vendor account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // Sign in with Google
      const authUser = await signInWithGoogle();
      
      // Check if user already exists in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', authUser.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Check if user is already a vendor
        const userData = querySnapshot.docs[0].data();
        if (userData.userType === 'vendor') {
          // Update context
          dispatch({ 
            type: 'SET_FIREBASE_USER', 
            payload: { 
              id: querySnapshot.docs[0].id, 
              ...userData 
            } 
          });
          
          navigate('/vendor-dashboard');
          return;
        }
        // If user exists but is not a vendor, show error
        setError('An account with this email already exists. Please log in or use a different email.');
        setIsSubmitting(false);
        return;
      }
      
      // New user - we'll continue with the form to get vendor details
      // Just update the email in the form for now
      setFormData({
        ...formData,
        email: authUser.email,
        userName: authUser.displayName || formData.userName || authUser.email.split('@')[0]
      });
      
      // Keep the auth user in context but don't navigate yet - 
      // they still need to complete the vendor details
      
    } catch (err) {
      console.error('Error signing up with Google:', err);
      setError(err.message || 'Failed to sign up with Google. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          
          {/* Only show password fields if user is not authenticated with Google */}
          {!user && (
            <>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required={!user}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required={!user}
                />
              </div>
            </>
          )}
          
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
          disabled={isSubmitting || user}
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