// src/components/VendorShopManager.js
import React, { useState } from 'react';
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthContext } from '../hooks/useAuthContext';
import './VendorShopManager.css';

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

const VendorShopManager = ({ shops, onShopCreated, onShopSelect, selectedShop }) => {
  const { firebaseUser } = useAuthContext();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    category: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    website: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetForm = () => {
    setFormData({
      shopName: '',
      category: '',
      description: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      website: ''
    });
  };

  const handleEditShop = (shop) => {
    setFormData({
      shopName: shop.shopName || '',
      category: shop.category || '',
      description: shop.description || '',
      address: shop.address || '',
      city: shop.city || '',
      state: shop.state || '',
      zipCode: shop.zipCode || '',
      phone: shop.phone || '',
      website: shop.website || ''
    });
    setIsEditing(true);
    setIsCreating(false);
    onShopSelect(shop);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCreateShop = () => {
    resetForm();
    setIsCreating(true);
    setIsEditing(false);
    setError('');
    setSuccessMessage('');
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    resetForm();
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    
    if (!firebaseUser || !firebaseUser.id) {
      setError('You must be logged in to create a shop');
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (isCreating) {
        // Create new shop
        const shopData = {
          ...formData,
          vendorId: firebaseUser.id,
          vendorName: firebaseUser.userName,
          vendorEmail: firebaseUser.email,
          createdAt: new Date(),
          updatedAt: new Date(),
          active: true
        };
        
        const docRef = await addDoc(collection(db, 'shops'), shopData);
        
        const newShop = {
          id: docRef.id,
          ...shopData
        };
        
        onShopCreated(newShop);
        setSuccessMessage('Shop created successfully');
        setIsCreating(false);
        resetForm();
      } else if (isEditing && selectedShop) {
        // Update existing shop
        const shopRef = doc(db, 'shops', selectedShop.id);
        
        const updatedData = {
          ...formData,
          updatedAt: new Date()
        };
        
        await updateDoc(shopRef, updatedData);
        
        const updatedShop = {
          ...selectedShop,
          ...updatedData
        };
        
        onShopSelect(updatedShop);
        setSuccessMessage('Shop updated successfully');
        setIsEditing(false);
        resetForm();
      }
    } catch (err) {
      console.error('Error managing shop:', err);
      setError(isCreating ? 'Failed to create shop' : 'Failed to update shop');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteShop = async (shopId) => {
    if (alert('Are you sure you want to delete this shop? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'shops', shopId));
      
      // Update local state
      const updatedShops = shops.filter(shop => shop.id !== shopId);
      
      // If the deleted shop was selected, select another one or none
      if (selectedShop && selectedShop.id === shopId) {
        onShopSelect(updatedShops.length > 0 ? updatedShops[0] : null);
      }
      
      setSuccessMessage('Shop deleted successfully');
    } catch (err) {
      console.error('Error deleting shop:', err);
      setError('Failed to delete shop');
    }
  };

  return (
    <div className="shop-manager">
      <div className="shop-manager-header">
        <h2>Manage Your Shops</h2>
        {!isCreating && !isEditing && (
          <button className="primary-button" onClick={handleCreateShop}>
            Create New Shop
          </button>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {(isCreating || isEditing) ? (
        <div className="shop-form-container">
          <h3>{isCreating ? 'Create New Shop' : 'Edit Shop'}</h3>
          <form onSubmit={handleSubmit} className="shop-form">
            <div className="form-group">
              <label htmlFor="shopName">Shop Name</label>
              <input
                type="text"
                id="shopName"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                placeholder="Enter shop name"
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
                placeholder="Describe your shop and products..."
                rows="4"
                required
              ></textarea>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address"
                />
              </div>
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
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Shop Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Shop phone number"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="website">Website (Optional)</label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (isCreating ? 'Creating...' : 'Updating...')
                  : (isCreating ? 'Create Shop' : 'Update Shop')
                }
              </button>
              <button 
                type="button" 
                className="cancel-button" 
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="shops-list">
          {shops.length > 0 ? (
            shops.map(shop => (
              <div key={shop.id} className="shop-card">
                <div className="shop-card-header">
                  <h3>{shop.shopName}</h3>
                  <span className="shop-category">{shop.category}</span>
                </div>
                
                <p className="shop-description">{shop.description}</p>
                
                <div className="shop-details">
                  {shop.address && (
                    <div className="shop-address">
                      <strong>Address:</strong> {shop.address}, {shop.city}, {shop.state} {shop.zipCode}
                    </div>
                  )}
                  
                  {shop.phone && (
                    <div className="shop-phone">
                      <strong>Phone:</strong> {shop.phone}
                    </div>
                  )}
                  
                  {shop.website && (
                    <div className="shop-website">
                      <strong>Website:</strong> <a href={shop.website} target="_blank" rel="noopener noreferrer">{shop.website}</a>
                    </div>
                  )}
                </div>
                
                <div className="shop-actions">
                  <button 
                    className="edit-button"
                    onClick={() => handleEditShop(shop)}
                  >
                    Edit Shop
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDeleteShop(shop.id)}
                  >
                    Delete Shop
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-shops-message">
              <p>You don't have any shops yet. Create your first shop to start selling products!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VendorShopManager;