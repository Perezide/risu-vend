// src/components/VendorDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import VendorShopManager from '../components/VendorShopManager';
import ProductUpload from '../components/ProductUpload';
import SalesReport from '../components/SalesReport';
import './VendorDashboard.css';

const VendorDashboard = () => {
  const { firebaseUser } = useAuthContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is a vendor
    if (firebaseUser && firebaseUser.userType !== 'vendor') {
      navigate('/profile');
    }

    const fetchVendorShops = async () => {
      if (!firebaseUser || !firebaseUser.id) {
        setIsLoading(false);
        return;
      }

      try {
        const shopsQuery = query(
          collection(db, 'shops'),
          where('vendorId', '==', firebaseUser.id)
        );

        const shopsSnapshot = await getDocs(shopsQuery);
        const shopsData = shopsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Default to false if approved property doesn't exist
          approved: doc.data().approved === undefined ? false : doc.data().approved
        }));

        setShops(shopsData);
        
        // Select the first shop by default if available
        if (shopsData.length > 0) {
          setSelectedShop(shopsData[0]);
        }
      } catch (err) {
        console.error('Error fetching vendor shops:', err);
        setError('Failed to load shops');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorShops();
  }, [firebaseUser, navigate]);

  const handleShopSelect = (shop) => {
    setSelectedShop(shop);
  };

  const handleShopCreated = (newShop) => {
    // Add default approved: false if not present
    const shopWithApproval = {
      ...newShop,
      approved: newShop.approved === undefined ? false : newShop.approved
    };
    
    setShops(prevShops => [...prevShops, shopWithApproval]);
    setSelectedShop(shopWithApproval);
  };

  if (isLoading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  if (!firebaseUser) {
    return <div className="dashboard-error">Please log in to access vendor dashboard</div>;
  }

  // Check if vendor is approved
  if (!firebaseUser.approved) {
    return (
      <div className="vendor-pending-approval">
        <h2>Account Pending Approval</h2>
        <p>Your vendor account is currently under review by our administrators.</p>
        <p>You'll be notified once your account has been approved.</p>
        <p>Thank you for your patience!</p>
      </div>
    );
  }

  return (
    <div className="vendor-dashboard">
      <div className="dashboard-sidebar">
        <div className="vendor-info">
          <h3>{firebaseUser.shopName || 'My Shop'}</h3>
          <p>{firebaseUser.email}</p>
          <div className="vendor-status">
            <span className="status-indicator approved"></span>
            <span>Approved Vendor</span>
          </div>
        </div>
        
        <nav className="dashboard-nav">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'products' ? 'active' : ''} 
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
          <button 
            className={activeTab === 'sales' ? 'active' : ''} 
            onClick={() => setActiveTab('sales')}
          >
            Sales Reports
          </button>
          <button 
            className={activeTab === 'shops' ? 'active' : ''} 
            onClick={() => setActiveTab('shops')}
          >
            Shop Manager
          </button>
        </nav>
      </div>
      
      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}
        
        {activeTab === 'overview' && (
          <div className="dashboard-overview">
            <h2>Dashboard Overview</h2>
            
            <div className="overview-stats">
              <div className="stat-card">
                <h3>Shops</h3>
                <p className="stat-value">{shops.length}</p>
              </div>
              
              <div className="stat-card">
                <h3>Products</h3>
                <p className="stat-value">1</p>
              </div>
              
              <div className="stat-card">
                <h3>Total Sales</h3>
                <p className="stat-value">₦0.00</p>
              </div>
              
              <div className="stat-card">
                <h3>Account Status</h3>
                <p className="stat-value">
                  {firebaseUser.approved ? 'Approved' : 'Pending Approval'}
                </p>
              </div>
            </div>
            
            <div className="shop-selector">
              <h3>Your Shops</h3>
              {shops.length > 0 ? (
                <div className="shop-list">
                  {shops.map(shop => (
                    <div 
                      key={shop.id} 
                      className={`shop-item ${selectedShop && selectedShop.id === shop.id ? 'selected' : ''}`}
                      onClick={() => handleShopSelect(shop)}
                    >
                      <h4>{shop.shopName}</h4>
                      <p>{shop.category}</p>
                      {/* Added shop approval status indicator */}
                      <div className="shop-approval-status">
                        <span className={`status-badge ${shop.approved ? 'approved' : 'pending'}`}>
                          {shop.approved ? 'Approved' : 'Pending Approval'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-shops">
                  <p>You haven't created any shops yet.</p>
                  <button 
                    className="primary-button"
                    onClick={() => setActiveTab('shops')}
                  >
                    Create Your First Shop
                  </button>
                </div>
              )}
            </div>
            
            {/* Added section for pending shops */}
            {shops.filter(shop => !shop.approved).length > 0 && (
              <div className="pending-shops-notice">
                <h3>Pending Shop Approvals</h3>
                <p>You have {shops.filter(shop => !shop.approved).length} shop(s) pending approval by administrators.</p>
                <p>Products in pending shops won't be visible to customers until the shop is approved.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'products' && (
          <ProductUpload 
            selectedShop={selectedShop} 
            shops={shops}
            onShopSelect={handleShopSelect}
          />
        )}
        
        {activeTab === 'sales' && (
          <SalesReport 
            selectedShop={selectedShop}
            shops={shops}
            onShopSelect={handleShopSelect}
          />
        )}
        
        {activeTab === 'shops' && (
          <VendorShopManager 
            shops={shops} 
            onShopCreated={handleShopCreated}
            onShopSelect={handleShopSelect}
            selectedShop={selectedShop}
          />
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;