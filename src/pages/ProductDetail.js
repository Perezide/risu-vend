import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  ShoppingCart, 
  Heart,
  Star,
  ChevronLeft, 
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { db, auth } from '../firebase/config';
import { toast } from 'react-hot-toast';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [saved, setSaved] = useState(false);

  // Fetch product, shop, and reviews data
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        
        // Fetch product details
        const productDocRef = doc(db, 'products', productId);
        const productDoc = await getDoc(productDocRef);
        
        if (!productDoc.exists()) {
          setError("Product not found");
          setLoading(false);
          return;
        }
        
        const productData = {
          id: productDoc.id,
          ...productDoc.data(),
          images: productDoc.data().images || [productDoc.data().imageUrl] // Handle single or multiple images
        };
        
        setProduct(productData);
        
        // Fetch shop details
        if (productData.shopId) {
          const shopDocRef = doc(db, 'shops', productData.shopId);
          const shopDoc = await getDoc(shopDocRef);
          
          if (shopDoc.exists()) {
            setShop({
              id: shopDoc.id,
              ...shopDoc.data()
            });
          }
        }
        
        // Fetch product reviews
        const reviewsRef = collection(db, 'reviews');
        const reviewsQuery = query(
          reviewsRef,
          where('productId', '==', productId),
          orderBy('createdAt', 'desc')
        );
        
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setReviews(reviewsData);
        
        // Fetch related products (from same shop or category)
        if (productData.shopId && productData.category) {
          const relatedProductsRef = collection(db, 'products');
          const relatedProductsQuery = query(
            relatedProductsRef,
            where('shopId', '==', productData.shopId),
            where('id', '!=', productId),
            limit(4)
          );
          
          const relatedProductsSnapshot = await getDocs(relatedProductsQuery);
          const relatedProductsData = relatedProductsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setRelatedProducts(relatedProductsData);
        }
        
        // Check if product is saved by current user
        const user = auth.currentUser;
        if (user) {
          const savedItemsRef = collection(db, 'savedItems');
          const savedItemQuery = query(
            savedItemsRef,
            where('userId', '==', user.uid),
            where('productId', '==', productId)
          );
          
          const savedItemSnapshot = await getDocs(savedItemQuery);
          setSaved(!savedItemSnapshot.empty);
        }
        
      } catch (err) {
        console.error("Error fetching product data:", err);
        setError("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };
    
    if (productId) {
      fetchProductData();
    }
  }, [productId]);
  
  // Handle image navigation
  const nextImage = () => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };
  
  const prevImage = () => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? product.images.length - 1 : prevIndex - 1
      );
    }
  };
  
  // Handle adding product to cart
  const handleAddToCart = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in to add items to your cart.");
        return;
      }

      await addDoc(collection(db, 'cart'), {
        userId: user.uid,
        productId: product.id,
        name: product.name,
        imageUrl: product.images[0],
        price: product.price,
        quantity: quantity,
        size: selectedSize,
        shopId: product.shopId,
        shopName: shop?.shopName || '',
        addedAt: serverTimestamp()
      });

      toast.success(`${product.name} has been added to your cart.`);
    } catch (error) {
      console.error("Error adding product to cart:", error);
      toast.error("Failed to add product to cart.");
    }
  };
  
  // Handle checkout (add to cart and navigate to checkout)
  const handleCheckout = async () => {
    try {
      await handleAddToCart();
      navigate('/checkout');
    } catch (error) {
      console.error("Error proceeding to checkout:", error);
    }
  };
  
  // Handle saving/unsaving product
  const handleToggleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in to save products.");
        return;
      }
      
      const savedItemsRef = collection(db, 'savedItems');
      const savedItemQuery = query(
        savedItemsRef,
        where('userId', '==', user.uid),
        where('productId', '==', productId)
      );
      
      const savedItemSnapshot = await getDocs(savedItemQuery);
      
      if (savedItemSnapshot.empty) {
        // Save the product
        await addDoc(collection(db, 'savedItems'), {
          userId: user.uid,
          productId: product.id,
          name: product.name,
          imageUrl: product.images[0],
          price: product.price,
          shopId: product.shopId,
          savedAt: serverTimestamp()
        });
        
        setSaved(true);
        toast.success(`${product.name} has been saved to your favorites.`);
      } else {
        // Remove from saved items
        const savedItemDoc = savedItemSnapshot.docs[0];
        await savedItemDoc.ref.delete();
        
        setSaved(false);
        toast.success(`${product.name} has been removed from your favorites.`);
      }
    } catch (error) {
      console.error("Error toggling save status:", error);
      toast.error("Failed to update saved items.");
    }
  };
  
  // Handle submitting a review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in to submit a review.");
        return;
      }
      
      if (reviewText.trim() === '') {
        toast.error("Please enter a review comment.");
        return;
      }
      
      const newReview = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL || '',
        productId: product.id,
        shopId: product.shopId,
        rating: rating,
        comment: reviewText,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'reviews'), newReview);
      
      // Add the new review to the state
      setReviews([
        {
          id: 'temp-' + Date.now(),
          ...newReview,
          createdAt: { toDate: () => new Date() }
        },
        ...reviews
      ]);
      
      // Reset form
      setReviewText('');
      setRating(5);
      setShowReviewForm(false);
      
      toast.success("Your review has been submitted. Thank you!");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit your review.");
    }
  };
  
  if (loading) {
    return <div className="product-loading">Loading product details...</div>;
  }
  
  if (error) {
    return <div className="product-error">{error}</div>;
  }
  
  if (!product) {
    return <div className="product-not-found">Product not found</div>;
  }
  
  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;
  
  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        <div className="product-image-gallery">
          <div className="current-image-container">
            {product.images.length > 1 && (
              <button className="image-nav prev" onClick={prevImage}>
                <ChevronLeft />
              </button>
            )}
            
            <img 
              src={product.images[currentImageIndex]} 
              alt={product.name} 
              className="current-product-image" 
            />
            
            {product.images.length > 1 && (
              <button className="image-nav next" onClick={nextImage}>
                <ChevronRight />
              </button>
            )}
          </div>
          
          {product.images.length > 1 && (
            <div className="image-thumbnails">
              {product.images.map((image, index) => (
                <div 
                  key={index}
                  className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img src={image} alt={`${product.name} thumbnail ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="product-info-container">
          {shop && (
            <div className="product-shop-info">
              <span className="shop-name" onClick={() => navigate(`/shop/${shop.id}`)}>
                {shop.shopName}
              </span>
            </div>
          )}
          
          <h1 className="product-name">{product.name}</h1>
          
          <div className="product-meta">
            <div className="product-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  size={16}
                  fill={star <= Math.round(averageRating) ? "#FFD700" : "none"}
                  stroke={star <= Math.round(averageRating) ? "#FFD700" : "#666"}
                />
              ))}
              <span>({reviews.length} reviews)</span>
            </div>
            
            {product.category && (
              <span className="product-category">{product.category}</span>
            )}
          </div>
          
          <div className="product-price">₦{product.price?.toFixed(2)}</div>
          
          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>
          
          {product.sizes && product.sizes.length > 0 && (
            <div className="product-sizes">
              <h3>Size</h3>
              <div className="size-options">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="product-quantity">
            <h3>Quantity</h3>
            <div className="quantity-selector">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                -
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)}>+</button>
            </div>
          </div>
          
          <div className="product-actions">
            <button 
              className="add-to-cart-btn"
              onClick={handleAddToCart}
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>
            
            <button 
              className={`save-product-btn ${saved ? 'saved' : ''}`}
              onClick={handleToggleSave}
            >
              <Heart size={18} fill={saved ? "#ff4d4f" : "none"} />
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
          
          <button 
            className="checkout-btn"
            onClick={handleCheckout}
          >
            Checkout Now
          </button>
        </div>
      </div>
      
      <div className="product-reviews-section">
        <div className="reviews-header">
          <h2>Customer Reviews</h2>
          <button 
            className="write-review-btn"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            <MessageSquare size={16} />
            Write a Review
          </button>
        </div>
        
        {showReviewForm && (
          <div className="review-form-container">
            <form onSubmit={handleSubmitReview} className="review-form">
              <div className="rating-selector">
                <h3>Your Rating</h3>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      size={24}
                      onClick={() => setRating(star)}
                      fill={star <= rating ? "#FFD700" : "none"}
                      stroke={star <= rating ? "#FFD700" : "#666"}
                      className="rating-star"
                    />
                  ))}
                </div>
              </div>
              
              <div className="review-comment">
                <h3>Your Review</h3>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowReviewForm(false)}>
                  Cancel
                </button>
                <button type="submit">
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        )}
        
        <div className="reviews-list">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div className="review-item" key={review.id}>
                <div className="review-header">
                  <div className="reviewer-info">
                    {review.userPhotoURL ? (
                      <img src={review.userPhotoURL} alt={review.userName} className="reviewer-avatar" />
                    ) : (
                      <div className="reviewer-avatar-placeholder">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="reviewer-name">{review.userName}</span>
                  </div>
                  
                  <div className="review-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        size={14}
                        fill={star <= review.rating ? "#FFD700" : "none"}
                        stroke={star <= review.rating ? "#FFD700" : "#666"}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="review-content">
                  <p>{review.comment}</p>
                </div>
                
                <div className="review-date">
                  {review.createdAt?.toDate ? 
                    new Date(review.createdAt.toDate()).toLocaleDateString() : 
                    'Just now'}
                </div>
              </div>
            ))
          ) : (
            <div className="no-reviews">
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>
      
      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <h2>You Might Also Like</h2>
          <div className="related-products-grid">
            {relatedProducts.map(relatedProduct => (
              <div 
                className="related-product-card" 
                key={relatedProduct.id}
                onClick={() => navigate(`/product/${relatedProduct.id}`)}
              >
                <div className="related-product-image-container">
                  <img 
                    src={relatedProduct.imageUrl} 
                    alt={relatedProduct.name} 
                    className="related-product-image" 
                  />
                </div>
                <div className="related-product-info">
                  <h3 className="related-product-name">{relatedProduct.name}</h3>
                  <p className="related-product-price">${relatedProduct.price?.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;