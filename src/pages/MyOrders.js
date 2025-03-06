import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '../hooks/useAuthContext';
import { 
  Package, 
  ArrowLeft, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink 
} from 'lucide-react';
import './MyOrders.css';

const MyOrders = () => {
  const navigate = useNavigate();
  const { user, firebaseUser, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  // Fetch orders when auth is ready
  useEffect(() => {
    const fetchOrders = async () => {
      // Don't fetch until auth is ready
      if (authLoading) return;
      
      try {
        setLoading(true);
        
        // Check if user is logged in
        if (!isAuthenticated || (!user && !firebaseUser)) {
          setError("You must be logged in to view your orders");
          setLoading(false);
          return;
        }
        
        // Get the correct user ID - prioritize firebaseUser if available
        const userId = firebaseUser?.id || user?.uid;
        
        if (!userId) {
          setError("Unable to identify user. Please try logging in again.");
          setLoading(false);
          return;
        }
        
        // Fetch orders
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(
          ordersRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to Date objects
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        }));
        
        setOrders(ordersData);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load your orders");
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user, firebaseUser, isAuthenticated, authLoading]);
  
  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return 'status-processing';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-processing';
    }
  };
  
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatCurrency = (amount) => {
    return `₦${amount.toFixed(2)}`;
  };
  
  const toggleOrderDetails = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };
  
  const handleViewOrderDetails = (orderId) => {
    navigate(`/orders/${orderId}`);
  };
  
  const renderOrderItem = (item) => (
    <div className="order-item" key={item.id}>
      <div className="item-image">
        <img src={item.imageUrl} alt={item.name} />
      </div>
      <div className="item-details">
        <h4>{item.name}</h4>
        <div className="item-meta">
          {item.size && <span>Size: {item.size}</span>}
          <span>Qty: {item.quantity}</span>
          <span>Price: {formatCurrency(item.price)}</span>
        </div>
      </div>
      <div className="item-price">
        {formatCurrency(item.price * item.quantity)}
      </div>
    </div>
  );
  
  const renderOrderCard = (order) => {
    const isExpanded = expandedOrder === order.id;
    
    return (
      <div className="order-card" key={order.id}>
        <div className="order-header" onClick={() => toggleOrderDetails(order.id)}>
          <div className="order-info">
            <div className="order-id">
              <span className="order-number">Order #{order.id.slice(-8)}</span>
              <div className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                {order.status}
              </div>
            </div>
            <div className="order-meta">
              <span className="order-date">Placed on {formatDate(order.createdAt)}</span>
              <span className="order-total">{formatCurrency(order.orderSummary.total)}</span>
            </div>
          </div>
          <div className="expand-icon">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="order-details">
            <div className="order-items">
              <h3>Items</h3>
              {order.items.map(item => renderOrderItem(item))}
            </div>
            
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatCurrency(order.orderSummary.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>
                  {order.orderSummary.shipping === 0 
                    ? 'Free' 
                    : formatCurrency(order.orderSummary.shipping)}
                </span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>{formatCurrency(order.orderSummary.total)}</span>
              </div>
            </div>
            
            <div className="shipping-details">
              <h3>Shipping Details</h3>
              <p><strong>Name:</strong> {order.shippingDetails.fullName}</p>
              <p><strong>Address:</strong> {order.shippingDetails.address}</p>
              <p><strong>City:</strong> {order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.zipCode}</p>
              <p><strong>Phone:</strong> {order.shippingDetails.phone}</p>
              <p><strong>Email:</strong> {order.shippingDetails.email}</p>
              {order.shippingDetails.notes && (
                <p><strong>Notes:</strong> {order.shippingDetails.notes}</p>
              )}
            </div>
            
            <div className="payment-details">
              <h3>Payment Details</h3>
              <p><strong>Payment Method:</strong> {order.payment.method}</p>
              <p><strong>Reference:</strong> {order.payment.reference}</p>
              <p><strong>Status:</strong> {order.payment.status}</p>
            </div>
            
            <div className="order-actions">
              <button 
                className="view-details-button"
                onClick={() => handleViewOrderDetails(order.id)}
              >
                <ExternalLink size={16} />
                <span>View Full Details</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Show loading state while auth is being checked
  if (authLoading) {
    return <div className="orders-loading">Checking authentication...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="orders-login-required">
        <div className="icon-container">
          <AlertCircle size={64} />
        </div>
        <h2>Login Required</h2>
        <p>You need to be logged in to view your orders.</p>
        <button 
          className="login-button"
          onClick={() => navigate('/login')}
        >
          Log In
        </button>
      </div>
    );
  }
  
  // Show loading state while orders are being fetched
  if (loading) {
    return <div className="orders-loading">Loading your orders...</div>;
  }
  
  // Show error state
  if (error) {
    return <div className="orders-error">{error}</div>;
  }
  
  // If no orders, show empty state
  if (orders.length === 0) {
    return (
      <div className="empty-orders">
        <div className="icon-container">
          <Package size={64} />
        </div>
        <h2>No Orders Found</h2>
        <p>You haven't placed any orders yet.</p>
        <button 
          className="shop-now-button"
          onClick={() => navigate('/')}
        >
          Shop Now
        </button>
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <div className="orders-header">
        <h1>My Orders</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={16} />
          <span>Back to Shopping</span>
        </button>
      </div>
      
      <div className="orders-container">
        {orders.map(order => renderOrderCard(order))}
      </div>
    </div>
  );
};

export default MyOrders;