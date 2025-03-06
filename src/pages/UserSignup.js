// src/components/UserSignup.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthContext } from '../hooks/useAuthContext';
import './Signup.css';
import googleIcon from '../assets/google-icon.svg';

const UserSignup = () => {
  const { signup, signInWithGoogle, dispatch } = useAuthContext();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    userName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
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
      const user = await signup(formData.email, formData.password);
      
      // Check if user already exists in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Add user to Firestore if not exists
        const newUserData = {
          userName: formData.userName,
          phoneNumber: formData.phoneNumber,
          email: user.email,
          userType: 'customer',
          createdAt: new Date()
        };
        
        const docRef = await addDoc(collection(db, 'users'), newUserData);
        
        // Update AuthContext with the new Firebase user data
        const userWithId = {
          id: docRef.id,
          ...newUserData
        };
        
        dispatch({ type: 'SET_FIREBASE_USER', payload: userWithId });
      }
      
      // Navigate to profile page
      navigate('/profile');
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // Sign in with Google
      const user = await signInWithGoogle();
      
      // Check if the user exists in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new user in Firestore
        const newUserData = {
          userName: user.displayName || user.email.split('@')[0],
          email: user.email,
          phoneNumber: user.phoneNumber || '',
          userType: 'customer',
          createdAt: new Date()
        };
        
        const docRef = await addDoc(collection(db, 'users'), newUserData);
        
        // Update context
        dispatch({ 
          type: 'SET_FIREBASE_USER', 
          payload: { 
            id: docRef.id, 
            ...newUserData 
          } 
        });
      } else {
        // Update context with existing user
        const userData = querySnapshot.docs[0].data();
        dispatch({ 
          type: 'SET_FIREBASE_USER', 
          payload: { 
            id: querySnapshot.docs[0].id, 
            ...userData 
          } 
        });
      }
      
      navigate('/profile');
    } catch (err) {
      console.error('Error signing up with Google:', err);
      setError(err.message || 'Failed to sign up with Google. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
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
          disabled={isSubmitting}
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