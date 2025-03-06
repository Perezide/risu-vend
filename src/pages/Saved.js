import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  orderBy, 
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Heart, ShoppingBag, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Saved.css';

const Saved = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSavedItems = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        
        if (!user) {
          navigate('/login');
          return;
        }
        
        const savedItemsRef = collection(db, 'savedItems');
        const savedItemsQuery = query(
          savedItemsRef,
          where('userId', '==', user.uid),
          orderBy('savedAt', 'desc')
        );
        
        const savedItemsSnapshot = await getDocs(savedItemsQuery);
        const savedItemsData = savedItemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setSavedItems(savedItemsData);
      } catch (err) {
        console.error("Error fetching saved items:", err);
        setError("Failed to load your saved items. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSavedItems();
  }, [navigate]);
  
  const handleRemoveSavedItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'savedItems', itemId));
      
      // Update state to remove the item
      setSavedItems(savedItems.filter(item => item.id !== itemId));
      
      toast.success("Item removed from your saved list");
    } catch (error) {
      console.error("Error removing saved item:", error);
      toast.error("Failed to remove item. Please try again.");
    }
  };
  
  const handleAddToCart = async (product) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in to add items to your cart.");
        return;
      }

      // Check if the product is still available
      const productRef = doc(db, 'products', product.productId);
      const productDoc = await getDocs(productRef);
      
      if (!productDoc.exists) {
        toast.error("This product is no longer available.");
        return;
      }

      await addDoc(collection(db, 'cart'), {
        userId: user.uid,
        productId: product.productId,
        name: product.name,
        imageUrl: product.imageUrl,
        price: product.price,
        quantity: 1,
        shopId: product.shopId,
        shopName: product.shopName || '',
        addedAt: serverTimestamp()
      });

      toast.success(`${product.name} has been added to your cart.`);
    } catch (error) {
      console.error("Error adding product to cart:", error);
      toast.error("Failed to add product to cart.");
    }
  };
  
  if (loading) {
    return <div className="saved-loading">Loading your saved items...</div>;
  }
  
  if (error) {
    return <div className="saved-error">{error}</div>;
  }
  
  if (savedItems.length === 0) {
    return (
      <div className="saved-empty">
        <Heart size={48} />
        <h2>Your saved items list is empty</h2>
        <p>Items you save will appear here. Start exploring products you love!</p>
        <button 
          className="explore-products-btn"
          onClick={() => navigate('/products')}
        >
          <ShoppingBag size={16} />
          Explore Products
        </button>
      </div>
    );
  }
  
  return (
    <div className="saved-page">
      <h1 className="saved-title">
        <Heart size={20} fill="#ff4d4f" />
        Your Saved Items
      </h1>
      
      <div className="saved-items-grid">
        {savedItems.map(item => (
          <div key={item.id} className="saved-item-card">
            <div 
              className="saved-item-image"
              onClick={() => navigate(`/product/${item.productId}`)}
            >
              <img src={item.imageUrl} alt={item.name} />
            </div>
            
            <div className="saved-item-info">
              <h3 
                className="saved-item-name"
                onClick={() => navigate(`/product/${item.productId}`)}
              >
                {item.name}
              </h3>
              
              <div className="saved-item-price">${item.price?.toFixed(2)}</div>
              
              <div className="saved-item-actions">
                <button 
                  className="add-to-cart-button"
                  onClick={() => handleAddToCart(item)}
                >
                  <ShoppingBag size={16} />
                  Add to Cart
                </button>
                
                <button 
                  className="remove-saved-button"
                  onClick={() => handleRemoveSavedItem(item.id)}
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Saved;