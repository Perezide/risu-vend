import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '../hooks/useAuthContext';
import { 
  CreditCard, 
  MapPin, 
  ArrowLeft, 
  ShoppingBag, 
  AlertCircle 
} from 'lucide-react';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { user, firebaseUser, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    shipping: 0,
    total: 0
  });
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    notes: ''
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentReference, setPaymentReference] = useState(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Flutterwave public key
  const FLUTTERWAVE_PUBLIC_KEY = process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY;
  
  // Fetch cart items when auth is ready
  useEffect(() => {
    const fetchCartItems = async () => {
      // Don't fetch until auth is ready
      if (authLoading) return;
      
      try {
        setLoading(true);
        
        // Check if user is logged in
        if (!isAuthenticated || (!user && !firebaseUser)) {
          setError("You must be logged in to checkout");
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
        
        // Fetch cart items
        const cartRef = collection(db, 'cart');
        const cartQuery = query(
          cartRef,
          where('userId', '==', userId)
        );
        
        const cartSnapshot = await getDocs(cartQuery);
        const cartData = cartSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setCartItems(cartData);
        
        // Prefill form with user data if available
        if (user) {
          const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            setFormData(prev => ({
              ...prev,
              fullName: userData.displayName || '',
              email: userData.email || '',
              phone: userData.phoneNumber || '',
              address: userData.address || '',
              city: userData.city || '',
              state: userData.state || '',
              zipCode: userData.zipCode || ''
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching cart items:", err);
        setError("Failed to load cart items");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCartItems();
  }, [user, firebaseUser, isAuthenticated, authLoading]);
  
  // Calculate order summary whenever cart items change
  useEffect(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // Calculate shipping cost based on subtotal
    // Free shipping over ₦10,000, otherwise ₦1,500
    const shipping = subtotal > 10000 ? 0 : 1500;
    
    setOrderSummary({
      subtotal,
      shipping,
      total: subtotal + shipping
    });
  }, [cartItems]);
  
  // Load Flutterwave script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  const getUserId = () => {
    // Get the correct user ID - prioritize firebaseUser if available
    return firebaseUser?.id || user?.uid;
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateShippingForm = () => {
    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state'];
    
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        setError(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field`);
        return false;
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Validate phone number (simple validation)
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/[^0-9]/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }
    
    setError(null);
    return true;
  };
  
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateShippingForm()) {
        setCurrentStep(2);
      }
    }
  };
  
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSubmitOrder = async (paymentRef = null) => {
    try {
      setLoading(true);
      
      const userId = getUserId();
      
      // Create a new order
      const orderData = {
        userId: userId,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          shopName: item.shopName || 'Unknown Shop',
          size: item.size || null
        })),
        shippingDetails: {
          ...formData,
          createdAt: serverTimestamp()
        },
        orderSummary: {
          subtotal: orderSummary.subtotal,
          shipping: orderSummary.shipping,
          total: orderSummary.total
        },
        payment: {
          method: 'flutterwave',
          reference: paymentRef,
          status: 'completed',
          amount: orderSummary.total
        },
        status: 'processing',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add the order to Firestore
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Clear the cart
      for (const item of cartItems) {
        await deleteDoc(doc(db, 'cart', item.id));
      }
      
      setOrderId(orderRef.id);
      setOrderComplete(true);
      setCurrentStep(3);
      toast.success('Order placed successfully!');
      
    } catch (err) {
      console.error("Error placing order:", err);
      setError("Failed to place order");
      toast.error("Failed to place order");
    } finally {
      setLoading(false);
    }
  };
  
  // Flutterwave payment implementation 
  const handleFlutterwavePayment = () => {
    if (!validateShippingForm()) {
      return;
    }

    if (!window.FlutterwaveCheckout) {
      console.error('Flutterwave SDK not loaded');
      setError('Payment system not available. Please try again later.');
      return;
    }
    
    const config = {
      public_key: FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: `order-${Date.now()}`,
      amount: orderSummary.total,
      currency: 'NGN',
      payment_options: 'card,ussd,banktransfer',
      customer: {
        email: formData.email,
        name: formData.fullName,
        phone_number: formData.phone,
      },
      customizations: {
        title: 'Shop Order Payment',
        description: 'Payment for your order',
        logo: 'your-logo-url', // Replace with your logo URL
      },
      callback: async (response) => {
        if (response.status === 'successful') {
          setPaymentReference(response.transaction_id);
          await handleSubmitOrder(response.transaction_id);
        } else {
          toast.error('Payment was not successful');
        }
      },
      onclose: () => {
        console.log('Payment window closed');
        toast.error("Payment was cancelled. Please try again.");
      }
    };
    
    window.FlutterwaveCheckout(config);
  };
  
  const renderOrderSummary = () => (
    <div className="order-summary-container">
      <h3 className="summary-title">Order Summary</h3>
      
      <div className="summary-items">
        {cartItems.map(item => (
          <div className="summary-item" key={item.id}>
            <div className="item-image">
              <img src={item.imageUrl} alt={item.name} />
            </div>
            <div className="item-details">
              <h4>{item.name}</h4>
              <div className="item-meta">
                {item.size && <span>Size: {item.size}</span>}
                <span>Qty: {item.quantity}</span>
              </div>
            </div>
            <div className="item-price">
              ₦{(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="summary-totals">
        <div className="total-row">
          <span>Subtotal</span>
          <span>₦{orderSummary.subtotal.toFixed(2)}</span>
        </div>
        <div className="total-row">
          <span>Shipping</span>
          <span>
            {orderSummary.shipping === 0 
              ? 'Free' 
              : `₦${orderSummary.shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="total-row grand-total">
          <span>Total</span>
          <span>₦{orderSummary.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
  
  const renderShippingForm = () => (
    <div className="checkout-step shipping-details">
      <h2 className="step-title">
        <MapPin size={20} />
        <span>Shipping Information</span>
      </h2>
      
      <div className="form-grid">
        <div className="form-group full">
          <label htmlFor="fullName">Full Name*</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email Address*</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Phone Number*</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Enter your phone number"
            required
          />
        </div>
        
        <div className="form-group full">
          <label htmlFor="address">Address*</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Enter your street address"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="city">City*</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="Enter your city"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="state">State*</label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            placeholder="Enter your state"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="zipCode">Zip Code</label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleInputChange}
            placeholder="Enter your zip code"
          />
        </div>
        
        <div className="form-group full">
          <label htmlFor="notes">Order Notes (Optional)</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Special instructions for delivery"
            rows="3"
          ></textarea>
        </div>
      </div>
      
      <div className="form-actions">
        <button 
          className="back-button"
          onClick={() => navigate('/cart')}
        >
          <ArrowLeft size={16} />
          <span>Back to Cart</span>
        </button>
        
        <button 
          className="next-button"
          onClick={handleNextStep}
          disabled={loading}
        >
          <span>Continue to Payment</span>
        </button>
      </div>
    </div>
  );
  
  const renderPaymentForm = () => (
    <div className="checkout-step payment-details">
      <h2 className="step-title">
        <CreditCard size={20} />
        <span>Payment Method</span>
      </h2>
      
      <div className="payment-options">
        <div className="payment-method selected">
          <div className="payment-method-header">
            <input 
              type="radio" 
              id="flutterwave" 
              name="paymentMethod" 
              value="flutterwave"
              checked
              readOnly
            />
            <label htmlFor="flutterwave">Pay with Flutterwave</label>
          </div>
          <div className="payment-method-body">
            <p>You will be redirected to Flutterwave's secure payment page to complete your payment.</p>
            <p>Pay securely with card, bank transfer, USSD or other payment methods.</p>
            
            <div className="flutterwave-button-container">
              <button 
                className="flutterwave-pay-button"
                onClick={handleFlutterwavePayment}
                disabled={loading}
              >
                Pay Now ₦{orderSummary.total.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <button 
          className="back-button"
          onClick={handlePreviousStep}
          disabled={loading}
        >
          <ArrowLeft size={16} />
          <span>Back to Shipping</span>
        </button>
      </div>
    </div>
  );
  
  const renderOrderComplete = () => (
    <div className="checkout-step order-complete">
      <div className="order-success">
        <div className="success-icon">
          <ShoppingBag size={64} />
        </div>
        <h2>Order Placed Successfully!</h2>
        <p>Thank you for your order. Your order number is: <strong>#{orderId}</strong></p>
        <p>A confirmation email has been sent to <strong>{formData.email}</strong></p>
        
        <div className="order-details">
          <h3>Order Details</h3>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Payment Method:</strong> Flutterwave</p>
          <p><strong>Payment Reference:</strong> {paymentReference}</p>
          <p><strong>Total Amount:</strong> ₦{orderSummary.total.toFixed(2)}</p>
        </div>
        
        <div className="success-actions">
          <button 
            className="view-orders-button"
            onClick={() => navigate('/orders')}
          >
            View My Orders
          </button>
          
          <button 
            className="continue-shopping-button"
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
  
  // Show loading state while auth is being checked
  if (authLoading) {
    return <div className="checkout-loading">Checking authentication...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="checkout-login-required">
        <div className="empty-cart-icon">
          <AlertCircle size={64} />
        </div>
        <h2>Login Required</h2>
        <p>You need to be logged in to proceed to checkout.</p>
        <button 
          className="login-button"
          onClick={() => navigate('/login')}
        >
          Log In
        </button>
      </div>
    );
  }
  
  // Show loading state while cart items are being fetched
  if (loading) {
    return <div className="checkout-loading">Loading checkout information...</div>;
  }
  
  // Show error state
  if (error) {
    return <div className="checkout-error">{error}</div>;
  }
  
  // If cart is empty, redirect to cart page
  if (cartItems.length === 0 && !orderComplete) {
    return (
      <div className="empty-checkout">
        <div className="empty-cart-icon">
          <AlertCircle size={64} />
        </div>
        <h2>Your cart is empty</h2>
        <p>Add some items to your cart before proceeding to checkout.</p>
        <button 
          className="continue-shopping-btn"
          onClick={() => navigate('/')}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <div className="checkout-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Shipping</span>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Payment</span>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Confirmation</span>
          </div>
        </div>
      </div>
      
      <div className="checkout-content">
        <div className="checkout-main">
          {currentStep === 1 && renderShippingForm()}
          {currentStep === 2 && renderPaymentForm()}
          {currentStep === 3 && renderOrderComplete()}
        </div>
        
        <div className="checkout-sidebar">
          {renderOrderSummary()}
        </div>
      </div>
    </div>
  );
};

export default Checkout;