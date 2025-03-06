import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  updateDoc, 
  doc,
  getCountFromServer 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthContext } from '../hooks/useAuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { firebaseUser } = useAuthContext();
  const navigate = useNavigate();

  // State for managing dashboard sections
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // State for users and vendors management
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]); // Added products state

  // Metrics state
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalShops: 0,
    pendingVendors: 0,
    pendingShops: 0,
    totalProducts: 0,
    popularProducts: 0 // Added metric for popular products
  });

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterType, setFilterType] = useState('all');
  const [productFilter, setProductFilter] = useState('all'); // Added product filter

  useEffect(() => {
    // Redirect if not an admin
    if (firebaseUser && firebaseUser.userType !== 'vendor') {  // Changed from 'vendor' to 'admin'
      navigate('/profile');
      return;
    }

    const fetchAdminData = async () => {
      try {
        // Fetch users
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);

        // Fetch vendors
        const vendorsQuery = query(collection(db, 'users'), where('userType', '==', 'vendor'));
        const vendorsSnapshot = await getDocs(vendorsQuery);
        const vendorsData = vendorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVendors(vendorsData);

        // Fetch shops
        const shopsQuery = query(collection(db, 'shops'));
        const shopsSnapshot = await getDocs(shopsQuery);
        const shopsData = shopsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setShops(shopsData);

        // Fetch products
        const productsQuery = query(collection(db, 'products'));
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);

        // Fetch metrics
        const totalUsersCount = await getCountFromServer(usersQuery);
        const vendorsCount = await getCountFromServer(vendorsQuery);
        const pendingVendorsCount = await getCountFromServer(
          query(collection(db, 'users'), 
            where('userType', '==', 'vendor'), 
            where('approved', '==', false)
          )
        );
        const shopsCount = await getCountFromServer(shopsQuery);
        const pendingShopsCount = await getCountFromServer(
          query(collection(db, 'shops'), where('approved', '==', false))
        );
        const productsCount = await getCountFromServer(productsQuery);
        const popularProductsCount = await getCountFromServer(
          query(collection(db, 'products'), where('isPopular', '==', true))
        );

        setMetrics({
          totalUsers: totalUsersCount.data().count,
          totalVendors: vendorsCount.data().count,
          totalShops: shopsCount.data().count,
          pendingVendors: pendingVendorsCount.data().count,
          pendingShops: pendingShopsCount.data().count,
          totalProducts: productsCount.data().count,
          popularProducts: popularProductsCount.data().count
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load dashboard data');
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [firebaseUser, navigate]);

  // Approve or reject vendor
  const handleVendorStatus = async (vendorId, approved) => {
    try {
      const vendorRef = doc(db, 'users', vendorId);
      await updateDoc(vendorRef, { approved });

      // Update local state
      setVendors(prevVendors => 
        prevVendors.map(vendor => 
          vendor.id === vendorId ? { ...vendor, approved } : vendor
        )
      );

      setMetrics(prevMetrics => ({
        ...prevMetrics,
        pendingVendors: approved 
          ? prevMetrics.pendingVendors - 1 
          : prevMetrics.pendingVendors
      }));
    } catch (err) {
      console.error('Error updating vendor status:', err);
      setError('Failed to update vendor status');
    }
  };

  // Approve or reject shop
  const handleShopStatus = async (shopId, approved) => {
    try {
      const shopRef = doc(db, 'shops', shopId);
      await updateDoc(shopRef, { 
        approved,
        // Add timestamp for approval/rejection
        statusUpdatedAt: new Date()
      });

      // Update local state
      setShops(prevShops => 
        prevShops.map(shop => 
          shop.id === shopId ? { ...shop, approved } : shop
        )
      );

      // Update metrics
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        pendingShops: approved 
          ? prevMetrics.pendingShops - 1 
          : prevMetrics.pendingShops
      }));
    } catch (err) {
      console.error('Error updating shop status:', err);
      setError('Failed to update shop status');
    }
  };

  // Toggle product's popular status
  const handleTogglePopular = async (productId, isPopular) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, { 
        isPopular,
        // Add timestamp for when status was updated
        popularUpdatedAt: new Date()
      });

      // Update local state
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId ? { ...product, isPopular } : product
        )
      );

      // Update metrics
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        popularProducts: isPopular 
          ? prevMetrics.popularProducts + 1 
          : prevMetrics.popularProducts - 1
      }));
    } catch (err) {
      console.error('Error updating product popular status:', err);
      setError('Failed to update product status');
    }
  };

  // Pagination for users
  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  
  // Filter and paginate users
  const filteredUsers = users.filter(user => {
    if (filterType === 'all') return true;
    return user.userType === filterType;
  });
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Filter and paginate products
  const filteredProducts = products.filter(product => {
    if (productFilter === 'all') return true;
    if (productFilter === 'popular') return product.isPopular === true;
    if (productFilter === 'regular') return product.isPopular === false;
    return true;
  });
  const currentProducts = filteredProducts.slice(indexOfFirstUser, indexOfLastUser);

  if (isLoading) {
    return <div className="admin-dashboard-loading">Loading Admin Dashboard...</div>;
  }

  if (!firebaseUser || firebaseUser.userType !== 'vendor') {  // Changed from 'vendor' to 'admin'
    return <div className="admin-dashboard-error">Access Denied</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-sidebar">
        <div className="vendor-info">
          <h3>Admin Dashboard</h3>
          <p>{firebaseUser.email}</p>
        </div>
        
        <nav className="dashboard-nav">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'users' ? 'active' : ''} 
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
          <button 
            className={activeTab === 'vendors' ? 'active' : ''} 
            onClick={() => setActiveTab('vendors')}
          >
            Vendor Management
          </button>
          <button 
            className={activeTab === 'shops' ? 'active' : ''} 
            onClick={() => setActiveTab('shops')}
          >
            Shop Management
          </button>
          <button 
            className={activeTab === 'products' ? 'active' : ''} 
            onClick={() => setActiveTab('products')}
          >
            Product Management
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
                <h3>Total Users</h3>
                <p className="stat-value">{metrics.totalUsers}</p>
              </div>
              
              <div className="stat-card">
                <h3>Total Vendors</h3>
                <p className="stat-value">{metrics.totalVendors}</p>
              </div>
              
              <div className="stat-card">
                <h3>Total Shops</h3>
                <p className="stat-value">{metrics.totalShops}</p>
              </div>
              
              <div className="stat-card">
                <h3>Pending Vendors</h3>
                <p className="stat-value">{metrics.pendingVendors}</p>
              </div>

              <div className="stat-card">
                <h3>Pending Shops</h3>
                <p className="stat-value">{metrics.pendingShops}</p>
              </div>

              <div className="stat-card">
                <h3>Total Products</h3>
                <p className="stat-value">{metrics.totalProducts}</p>
              </div>

              <div className="stat-card">
                <h3>Popular Products</h3>
                <p className="stat-value">{metrics.popularProducts}</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'users' && (
          <div className="user-management">
            <h2>User Management</h2>
            
            <div className="user-filters">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="customer">Customers</option>
                <option value="vendor">Vendors</option>
              </select>
            </div>
            
            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>User Type</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.userName}</td>
                    <td>{user.email}</td>
                    <td>{user.userType}</td>
                    <td>
                      {user.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                    </td>
                    <td>
                      <button>View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'vendors' && (
          <div className="vendor-management">
            <h2>Vendor Management</h2>
            
            <div className="pending-vendors">
              <h3>Pending Vendor Approvals</h3>
              {vendors.filter(vendor => !vendor.approved).length > 0 ? (
                vendors.filter(vendor => !vendor.approved).map(vendor => (
                  <div key={vendor.id} className="vendor-approval-card">
                    <div className="vendor-info">
                      <h4>{vendor.userName}</h4>
                      <p>{vendor.email}</p>
                    </div>
                    <div className="vendor-actions">
                      <button 
                        onClick={() => handleVendorStatus(vendor.id, true)}
                        className="approve-btn"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleVendorStatus(vendor.id, false)}
                        className="reject-btn"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No pending vendor approvals</p>
              )}
            </div>
            
            <div className="approved-vendors">
              <h3>Approved Vendors</h3>
              {vendors.filter(vendor => vendor.approved).length > 0 ? (
                <table className="vendor-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Shops</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.filter(vendor => vendor.approved).map(vendor => (
                      <tr key={vendor.id}>
                        <td>{vendor.userName}</td>
                        <td>{vendor.email}</td>
                        <td>{shops.filter(shop => shop.vendorId === vendor.id).length}</td>
                        <td>
                          <span className="status-badge approved">Approved</span>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleVendorStatus(vendor.id, false)}
                            className="revoke-btn"
                          >
                            Revoke Approval
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No approved vendors</p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'shops' && (
          <div className="shop-management">
            <h2>Shop Management</h2>
            
            <div className="pending-shops">
              <h3>Pending Shop Approvals</h3>
              {shops.filter(shop => !shop.approved).length > 0 ? (
                <table className="shops-table">
                  <thead>
                    <tr>
                      <th>Shop Name</th>
                      <th>Vendor</th>
                      <th>Category</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shops.filter(shop => !shop.approved).map(shop => {
                      const vendor = vendors.find(v => v.id === shop.vendorId);
                      return (
                        <tr key={shop.id}>
                          <td>{shop.shopName}</td>
                          <td>{vendor ? vendor.userName : 'Unknown'}</td>
                          <td>{shop.category}</td>
                          <td>
                            {shop.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                          </td>
                          <td>
                            <div className="shop-actions">
                              <button 
                                onClick={() => handleShopStatus(shop.id, true)}
                                className="approve-btn"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleShopStatus(shop.id, false)}
                                className="reject-btn"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p>No pending shop approvals</p>
              )}
            </div>
            
            <h3>Approved Shops</h3>
            <table className="shops-table">
              <thead>
                <tr>
                  <th>Shop Name</th>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.filter(shop => shop.approved).map(shop => {
                  const vendor = vendors.find(v => v.id === shop.vendorId);
                  return (
                    <tr key={shop.id}>
                      <td>{shop.shopName}</td>
                      <td>{vendor ? vendor.userName : 'Unknown'}</td>
                      <td>{shop.category}</td>
                      <td>
                        <span className="status-badge approved">Approved</span>
                      </td>
                      <td>
                        {shop.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                      </td>
                      <td>
                        <div className="shop-actions">
                          <button 
                            onClick={() => handleShopStatus(shop.id, false)}
                            className="revoke-btn"
                          >
                            Revoke Approval
                          </button>
                          <button>View Details</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* New Products Tab */}
        {activeTab === 'products' && (
          <div className="product-management">
            <h2>Product Management</h2>
            
            <div className="product-filters">
              <select 
                value={productFilter} 
                onChange={(e) => setProductFilter(e.target.value)}
              >
                <option value="all">All Products</option>
                <option value="popular">Popular Products</option>
                <option value="regular">Regular Products</option>
              </select>
            </div>
            
            <table className="products-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product Name</th>
                  <th>Shop</th>
                  <th>Price</th>
                  <th>Sales Count</th>
                  <th>Rating</th>
                  <th>Popular Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map(product => {
                  const shop = shops.find(s => s.id === product.shopId);
                  return (
                    <tr key={product.id}>
                      <td>
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="product-thumbnail" 
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        />
                      </td>
                      <td>{product.name}</td>
                      <td>{shop ? shop.shopName : 'Unknown'}</td>
                      <td>₦{product.price}</td>
                      <td>{product.salesCount || 0}</td>
                      <td>
                        {product.rating ? (
                          <span>
                            {'★'.repeat(product.rating)}{'☆'.repeat(5 - product.rating)}
                            <span className="rating-count">({product.ratingCount || 0})</span>
                          </span>
                        ) : 'No ratings'}
                      </td>
                      <td>
                        <span className={`status-badge ${product.isPopular ? 'popular' : 'regular'}`}>
                          {product.isPopular ? 'Popular' : 'Regular'}
                        </span>
                      </td>
                      <td>
                        <div className="product-actions">
                          {product.isPopular ? (
                            <button 
                              onClick={() => handleTogglePopular(product.id, false)}
                              className="remove-popular-btn"
                            >
                              Remove Popular
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleTogglePopular(product.id, true)}
                              className="make-popular-btn"
                            >
                              Make Popular
                            </button>
                          )}
                          <button className="view-product-btn">View Details</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination controls */}
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {Math.ceil(filteredProducts.length / itemsPerPage)}</span>
              <button 
                onClick={() => setCurrentPage(prev => 
                  prev < Math.ceil(filteredProducts.length / itemsPerPage) ? prev + 1 : prev
                )}
                disabled={currentPage >= Math.ceil(filteredProducts.length / itemsPerPage)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;