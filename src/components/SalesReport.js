import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import './SalesReport.css';

const SalesReport = ({ selectedShop, shops, onShopSelect }) => {
  // Remove firebaseUser since it's not being used
  // const { firebaseUser } = useAuthContext();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingProducts: []
  });

  const resetStats = () => {
    setStats({
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      topSellingProducts: []
    });
  };

  const calculateStats = useCallback(async(ordersData) => {
    if (!ordersData.length) {
      resetStats();
      return;
    }
    
    // Calculate total sales and average order value
    const totalSales = ordersData.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = ordersData.length;
    const averageOrderValue = totalSales / totalOrders;
    
    // Calculate top selling products
    const productSales = {};
    
    ordersData.forEach(order => {
      order.items.forEach(item => {
        if (productSales[item.productId]) {
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.price * item.quantity;
        } else {
          productSales[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            revenue: item.price * item.quantity
          };
        }
      });
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    
    setStats({
      totalSales,
      totalOrders,
      averageOrderValue,
      topSellingProducts: topProducts
    });
  },[])

  // Wrap fetchOrders in useCallback
  const fetchOrders = useCallback(async () => {
    if (!selectedShop) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Build date filters
      let startDate = null;
      let endDate = new Date();
      
      if (dateRange === 'today') {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === 'month') {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (dateRange === 'custom' && customStartDate) {
        startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
        
        if (customEndDate) {
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        }
      }
      
      // Create base query
      let ordersQuery = query(
        collection(db, 'orders'),
        where('shopId', '==', selectedShop.id),
        orderBy('createdAt', 'desc')
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      let ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      // Apply date filtering in JS (since Firestore can't handle complex queries)
      if (startDate) {
        ordersData = ordersData.filter(order => 
          order.createdAt >= startDate && order.createdAt <= endDate
        );
      }
      
      setOrders(ordersData);
      calculateStats(ordersData);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [selectedShop, dateRange, customStartDate, customEndDate, calculateStats]); // Include all dependencies

  useEffect(() => {
    if (selectedShop) {
      fetchOrders();
    } else {
      setOrders([]);
      resetStats();
    }
  }, [selectedShop, dateRange, customStartDate, customEndDate, fetchOrders]); // Add fetchOrders to dependency array

  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  return (
    <div className="sales-report-container">
      <div className="sales-header">
        <h2>Sales Reports</h2>
        
        {!shops.length ? (
          <div className="no-shop-message">
            <p>You need to create a shop before viewing sales reports</p>
          </div>
        ) : !selectedShop ? (
          <div className="no-shop-selected">
            <p>Please select a shop to view sales reports</p>
            <div className="shop-selector">
              {shops.map(shop => (
                <button 
                  key={shop.id} 
                  className="shop-select-btn"
                  onClick={() => onShopSelect(shop)}
                >
                  {shop.shopName}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="selected-shop-info">
              <p>Viewing reports for: <strong>{selectedShop.shopName}</strong></p>
            </div>
            
            <div className="report-filters">
              <div className="filter-group">
                <label htmlFor="dateRange">Date Range:</label>
                <select 
                  id="dateRange" 
                  value={dateRange} 
                  onChange={handleDateRangeChange}
                  className="filter-select"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              {dateRange === 'custom' && (
                <div className="custom-date-range">
                  <div className="filter-group">
                    <label htmlFor="startDate">Start Date:</label>
                    <input
                      type="date"
                      id="startDate"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="date-input"
                    />
                  </div>
                  
                  <div className="filter-group">
                    <label htmlFor="endDate">End Date:</label>
                    <input
                      type="date"
                      id="endDate"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="date-input"
                    />
                  </div>
                </div>
              )}
            </div>
            <br />
            <div className="sales-dashboard">
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Sales</h3>
                  <p className="stat-value">₦{(stats.totalSales)}</p>
                </div><br />
                
                <div className="stat-card">
                  <h3>Total Orders</h3>
                  <p className="stat-value">{stats.totalOrders}</p>
                </div><br />
                
                <div className="stat-card">
                  <h3>Average Order Value</h3>
                  <p className="stat-value">
                  ₦{(stats.averageOrderValue || 0)}
                  </p>
                </div>
              </div>
              
              <div className="sales-charts">
                <div className="top-products">
                  <h3>Top Selling Products</h3>
                  {stats.topSellingProducts.length > 0 ? (
                    <div className="top-products-list">
                      {stats.topSellingProducts.map((product, index) => (
                        <div key={product.productId} className="top-product-item">
                          <span className="product-rank">{index + 1}</span>
                          <div className="product-info">
                            <span className="product-name">{product.productName}</span>
                            <div className="product-metrics">
                              <span>{product.quantity} sold</span>
                              <span>₦{(product.revenue)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No product sales data available</p>
                  )}
                </div>
              </div>
              
              <div className="orders-table-container">
                <h3>Recent Orders</h3>
                
                {isLoading ? (
                  <div className="loading-message">Loading orders...</div>
                ) : error ? (
                  <div className="error-message">{error}</div>
                ) : orders.length === 0 ? (
                  <div className="no-orders-message">
                    <p>No orders found for the selected time period.</p>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="orders-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Date</th>
                          <th>Customer</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td>{order.id.substring(0, 8)}...</td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>{order.customerName || 'Anonymous'}</td>
                            <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                            <td>₦{(order.totalAmount)}</td>
                            <td>
                              <span className={`status-badge status-${order.status?.toLowerCase() || 'pending'}`}>
                                {order.status || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SalesReport;