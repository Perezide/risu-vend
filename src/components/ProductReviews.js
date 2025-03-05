import React, { useState, useEffect } from 'react';
import { 
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './ProductReview.css';

const ReviewCard = ({ review }) => {
  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-product-info">
          <img 
            src={review.productImage} 
            alt={review.productName} 
            className="review-product-image" 
          />
          <div className="review-product-details">
            <h4 className="review-product-name">{review.productName}</h4>
            <div className="review-product-category">{review.productCategory}</div>
          </div>
        </div>
      </div>
      
      <div className="review-rating">
        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
        <span className="review-date">
          {new Date(review.createdAt?.toDate()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>
      
      <div className="review-content">
        <p className="review-text">{review.reviewText}</p>
      </div>
      
      <div className="reviewer-info">
        <div className="reviewer-avatar">
          {review.userAvatar ? (
            <img src={review.userAvatar} alt={review.userName} />
          ) : (
            <div className="reviewer-avatar-placeholder">
              {review.userName?.charAt(0)}
            </div>
          )}
        </div>
        <div className="reviewer-name">{review.userName}</div>
      </div>
    </div>
  );
};

const ProductReview = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchFeaturedReviews = async () => {
      try {
        setLoading(true);
        const reviewsRef = collection(db, 'reviews');
        const q = query(
          reviewsRef,
          where('isFeatured', '==', true),
          orderBy('createdAt', 'desc'),
          limit(8)
        );
        
        const querySnapshot = await getDocs(q);
        const reviewsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching featured reviews:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeaturedReviews();
  }, []);
  
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 1 } }
    ]
  };
  
  if (loading) {
    return <div className="reviews-loading">Loading reviews...</div>;
  }
  
  if (reviews.length === 0) {
    return <div className="reviews-empty">No featured reviews available at the moment.</div>;
  }
  
  // Featured reviews for manual carousel
  const featuredReviews = [
    {
      id: 'featured1',
      productName: 'Premium Coffee Maker',
      productCategory: 'Kitchen Appliances',
      productImage: '/images/products/coffee-maker.jpg',
      rating: 5,
      reviewText: 'This coffee maker changed my morning routine completely. The coffee tastes amazing and the machine is so easy to use!',
      userName: 'Michael Johnson',
      userAvatar: '/images/avatars/michael.jpg',
      createdAt: { toDate: () => new Date('2024-12-15') }
    },
    {
      id: 'featured2',
      productName: 'Wireless Earbuds',
      productCategory: 'Electronics',
      productImage: '/images/products/earbuds.jpg',
      rating: 4,
      reviewText: 'Great sound quality and comfortable fit. Battery life could be better, but overall I am satisfied',
      userName: 'Sarah Williams',
      userAvatar: '/images/avatars/sarah.jpg',
      createdAt: { toDate: () => new Date('2025-01-10') }
    },
    {
      id: 'featured3',
      productName: 'Organic Face Cream',
      productCategory: 'Beauty & Skincare',
      productImage: '/images/products/face-cream.jpg',
      rating: 5,
      reviewText: 'My skin has never felt better! This face cream is worth every penny.',
      userName: 'Emma Davis',
      userAvatar: null,
      createdAt: { toDate: () => new Date('2025-02-05') }
    },
    {
      id: 'featured4',
      productName: 'Smart Watch Pro',
      productCategory: 'Wearable Tech',
      productImage: '/images/products/smartwatch.jpg',
      rating: 4,
      reviewText: 'Excellent fitness tracking features and the battery lasts for days. The interface is intuitive and responsive.',
      userName: 'David Lee',
      userAvatar: '/images/avatars/david.jpg',
      createdAt: { toDate: () => new Date('2025-01-25') }
    }
  ];
  
  // Use the database reviews or fallback to featured ones if database is empty
  const displayReviews = reviews.length > 0 ? reviews : featuredReviews;
  
  return (
    <section className="product-reviews-section">
      <div className="reviews-container">
        <h2 className="reviews-title">Customer Reviews</h2>
        <p className="reviews-subtitle">See what our customers are saying about our products</p>
        
        <div className="reviews-slider-container">
          <Slider {...sliderSettings}>
            {displayReviews.map(review => (
              <div key={review.id} className="review-slide">
                <ReviewCard review={review} />
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
};

export default ProductReview;