import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { 
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { ShoppingCart } from 'lucide-react';
import { db, auth } from '../firebase/config';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { toast } from 'react-hot-toast';
import './PopularProducts.css';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleProductClick = () => {
    navigate(`/product/${product.id}`);
  };

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
        imageUrl: product.imageUrl,
        quantity: 1,
        size: '',
        addedAt: serverTimestamp()
      });

      toast.success(`${product.name} has been added to your cart.`);
    } catch (error) {
      console.error("Error adding product to cart:", error);
      toast.error("Failed to add product to cart.");
    }
  };

  return (
    <div className="popular-product-card">
      <div onClick={handleProductClick} className="popular-product-card-content">
        <div className="popular-product-image-container">
          <img src={product.imageUrl} alt={product.name} className="popular-product-image" />
        </div>
        <h3 className="popular-product-name">{product.name}</h3>
        <div className="popular-product-price">${product.price}</div>
        {product.rating && (
          <div className="popular-product-rating">
            {'★'.repeat(product.rating)}{'☆'.repeat(5 - product.rating)}
            <span className="rating-count">({product.ratingCount || 0})</span>
          </div>
        )}
      </div>
      <div className="popular-product-card-actions">
        <button onClick={handleAddToCart} className="popular-add-to-cart">
          <ShoppingCart size={18} />
          Add to Cart
        </button>
        <button 
          onClick={handleProductClick} 
          className="popular-view-details"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

const PopularProducts = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        const productsRef = collection(db, 'products');
        const q = query(
          productsRef, 
          where('isPopular', '==', true), 
          orderBy('salesCount', 'desc'), 
          limit(8)
        );
        const querySnapshot = await getDocs(q);
        setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching popular products:", error);
      }
    };

    fetchPopularProducts();
  }, []);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } }
    ]
  };

  return (
    <section className="popular-products">
      <div className="popular-products-header">
        <h2>Popular Products</h2>
        <p>Most loved products by our customers</p>
      </div>
      
      <div className="popular-products-slider">
        <Slider {...sliderSettings}>
          {products.map(product => (
            <div key={product.id} className="popular-product-slide">
              <ProductCard product={product} />
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default PopularProducts;