// src/components/UserProfile.js
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthContext } from '../hooks/useAuthContext';
import './Profile.css';

const Profile = () => {
  const { firebaseUser } = useAuthContext();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    userName: '',
    phoneNumber: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!firebaseUser || !firebaseUser.id) {
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.id));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile(userData);
          setFormData({
            userName: userData.userName || '',
            phoneNumber: userData.phoneNumber || '',
            email: userData.email || '',
            address: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            zipCode: userData.zipCode || ''
          });
        } else {
          setError('User profile not found');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [firebaseUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset form data to original profile data
    if (profile) {
      setFormData({
        userName: profile.userName || '',
        phoneNumber: profile.phoneNumber || '',
        email: profile.email || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || ''
      });
    }
    setIsEditing(false);
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!firebaseUser || !firebaseUser.id) {
      setError('You must be logged in to update your profile');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', firebaseUser.id);
      
      await updateDoc(userRef, {
        userName: formData.userName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        updatedAt: new Date()
      });
      
      // Update local state
      setProfile({
        ...profile,
        ...formData,
        updatedAt: new Date()
      });
      
      setSuccessMessage('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (!firebaseUser) {
    return <div className="profile-error">Please log in to view your profile</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>My Profile</h2>
          {!isEditing && (
            <button className="edit-button" onClick={handleEdit}>
              Edit Profile
            </button>
          )}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="userName">Username</label>
              <input
                type="text"
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
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
                disabled
              />
              <small>Email cannot be changed</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your street address"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="state">State</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="zipCode">Zip Code</label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="Zip Code"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="primary-button">
                Save Changes
              </button>
              <button type="button" className="cancel-button" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="profile-section">
              <h3>Personal Information</h3>
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">Username:</span>
                  <span className="info-value">{profile?.userName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{profile?.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{profile?.phoneNumber}</span>
                </div>
              </div>
            </div>
            
            <div className="profile-section">
              <h3>Address Information</h3>
              <div className="profile-info">
                {profile?.address ? (
                  <>
                    <div className="info-item">
                      <span className="info-label">Address:</span>
                      <span className="info-value">{profile.address}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">City:</span>
                      <span className="info-value">{profile.city}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">State:</span>
                      <span className="info-value">{profile.state}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Zip Code:</span>
                      <span className="info-value">{profile.zipCode}</span>
                    </div>
                  </>
                ) : (
                  <p className="no-data">No address information provided</p>
                )}
              </div>
            </div>
            
            <div className="profile-section">
              <h3>Account Information</h3>
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">Account Type:</span>
                  <span className="info-value">{profile.userType}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Member Since:</span>
                  <span className="info-value">
                    {profile?.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;