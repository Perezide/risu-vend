// src/components/CompleteProfile.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthContext } from '../hooks/useAuthContext';
import '../pages/Signup.css';

const CompleteProfile = () => {
  const { user, dispatch, isAuthenticated, isLoading } = useAuthContext();
  const navigate = useNavigate();
  
  const [userType, setUserType] = useState('customer');
  const [formData, setFormData] = useState({
    userName: '',
    phoneNumber: '',
    // Additional fields for vendors
    shopName: '',
    category: '',
    description: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    navigate('/login');
    return null;
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleUserTypeChange = (e) => {
    setUserType(e.target.value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    if (!user || !user.email) {
      setError('Authentication information missing. Please log in again.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Base user data
      const userData = {
        userName: formData.userName,
        phoneNumber: formData.phoneNumber,
        email: user.email,
        userType: userType,
        createdAt: new Date()
      };
      
      // Add vendor-specific fields if applicable
      if (userType === 'vendor') {
        userData.shopName = formData.shopName;
        userData.category = formData.category;
        userData.description = formData.description;
        userData.approved = false;
      }
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'users'), userData);
      
      // Update context
      dispatch({ 
        type: 'SET_FIREBASE_USER', 
        payload: {
          id: docRef.id,
          ...userData
        }
      });
      
      // Navigate to appropriate page
      navigate(userType === 'vendor' ? '/vendor-dashboard' : '/profile');
    } catch (err) {
      console.error('Error completing profile:', err);
      setError('Failed to save your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h2>Complete Your Profile</h2>
          <p>Just a few more details to get started</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group radio-group">
            <label>I want to:</label>
            <div className="radio-options">
              <label>
                <input
                  type="radio"
                  name="userType"
                  value="customer"
                  checked={userType === 'customer'}
                  onChange={handleUserTypeChange}
                />
                Shop on RiSU Vend
              </label>
              <label>
                <input
                  type="radio"
                  name="userType"
                  value="vendor"
                  checked={userType === 'vendor'}
                  onChange={handleUserTypeChange}
                />
                Sell on RiSU Vend
              </label>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="userName">Your Name</label>
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
              placeholder="Enter your phone number"
              required
            />
          </div>
          
          {/* Vendor-specific fields */}
          {userType === 'vendor' && (
            <>
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
                  {/* Add your business categories here */}
                  <option value="Fashion">Fashion & Apparel</option>
                  <option value="Electronics">Electronics & Gadgets</option>
                  <option value="Home">Home & Kitchen</option>
                  <option value="Beauty">Beauty & Personal Care</option>
                  <option value="Food">Food & Beverages</option>
                  <option value="Other">Other</option>
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
            </>
          )}
          
          <button 
            type="submit" 
            className="primary-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;