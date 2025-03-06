import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ShoppingCart as CartIcon, Trash2, MinusCircle, PlusCircle, AlertCircle } from 'lucide-react';
import { db, auth } from '../firebase/config';
import { toast } from 'react-hot-toast';
import './ShoppingCart.css';

const ShoppingCart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Fetch cart items
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        setLoading(true);
        
        const user = auth.currentUser;
        if (!user) {
          setError("You must be logged in to view your cart");
          setLoading(false);
          return;
        }
        
        const cartRef = collection(db, 'cart');
        const cartQuery = query(
          cartRef,
          where('userId', '==', user.uid)
        );
        
        const cartSnapshot = await getDocs(cartQuery);
        const cartData = cartSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setCartItems(cartData);
      } catch (err) {
        console.error("Error fetching cart items:", err);
        setError("Failed to load cart items");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCartItems();
  }, []);
  
  // Calculate total price whenever cart items change
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    setTotalPrice(total);
  }, [cartItems]);
  
  const handleQuantityChange = async (item, change) => {
    try {
      const newQuantity = item.quantity + change;
      
      if (newQuantity < 1) {
        return; // Prevent quantity from going below 1
      }
      
      // Update quantity in Firestore
      const cartItemRef = doc(db, 'cart', item.id);
      await updateDoc(cartItemRef, {
        quantity: newQuantity,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setCartItems(prevItems => 
        prevItems.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: newQuantity } 
            : cartItem
        )
      );
      
      toast.success(`Quantity updated successfully.`);
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity.");
    }
  };
  
  const handleRemoveItem = async (itemId) => {
    try {
      // Delete from Firestore
      const cartItemRef = doc(db, 'cart', itemId);
      await deleteDoc(cartItemRef);
      
      // Update local state
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
      
      toast.success(`Item removed from cart.`);
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item from cart.");
    }
  };
  
  const handleCheckout = () => {
    navigate('/checkout');
  };
  
  if (loading) {
    return <div className="cart-loading">Loading your shopping cart...</div>;
  }
  
  if (error) {
    return <div className="cart-error">{error}</div>;
  }
  
  return (
    <div className="shopping-cart-page">
      <div className="cart-header">
        <h1>Your Shopping Cart</h1>
        <div className="cart-summary">
          <CartIcon size={20} />
          <span>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</span>
        </div>
      </div>
      
      {cartItems.length > 0 ? (
        <div className="cart-container">
          <div className="cart-items-container">
            {cartItems.map(item => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-image">
                  <img src={item.imageUrl} alt={item.name} />
                </div>
                
                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <div className="cart-item-shop">
                    from <span>{item.shopName || 'Unknown Shop'}</span>
                  </div>
                  {item.size && <p className="cart-item-size">Size: {item.size}</p>}
                </div>
                
                <div className="cart-item-price">
                  <div className="item-price">₦{item.price.toFixed(2)}</div>
                  <div className="quantity-controls">
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item, -1)}
                      disabled={item.quantity <= 1}
                    >
                      <MinusCircle size={18} />
                    </button>
                    <span className="quantity-value">{item.quantity}</span>
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item, 1)}
                    >
                      <PlusCircle size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="cart-item-subtotal">
                  <p className="subtotal-label">Subtotal:</p>
                  <p className="subtotal-value">₦{(item.price * item.quantity).toFixed(2)}</p>
                </div>
                
                <button 
                  className="remove-item-btn"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="cart-summary-section">
            <div className="cart-totals">
              <h3>Order Summary</h3>
              
              <div className="totals-row">
                <span>Subtotal</span>
                <span>₦{totalPrice.toFixed(2)}</span>
              </div>
              
              <div className="totals-row">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              
              <div className="totals-row total">
                <span>Total</span>
                <span>₦{totalPrice.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              className="checkout-btn"
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-cart">
          <div className="empty-cart-icon">
            <AlertCircle size={64} />
          </div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any items to your cart yet.</p>
          <button 
            className="continue-shopping-btn"
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </button>
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;