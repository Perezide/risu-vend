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
    <>
    <div 
    onClick={handleProductClick} 
  >
    <div className="shop-product-card">
        <div className="shop-product-image-container">
          <img src={product.imageUrl} alt={product.name} className="shop-product-image" />
        </div>
        <div onClick={handleProductClick} className="shop-product-info">
        <h3 className="popular-product-name">{product.name}</h3>
        <div className="shop-product-price">₦{product.price}</div>
        {product.rating && (
          <div className="popular-product-rating">
            {'★'.repeat(product.rating)}{'☆'.repeat(5 - product.rating)}
            <span className="rating-count">({product.ratingCount || 0})</span>
          </div>
        )}
      </div>
      <div className="shop-product-actions">
        <button onClick={(e) => {
          e.stopPropagation(); // Prevent click from bubbling to parent
          handleAddToCart();
        }} className="popular-add-to-cart">
          <ShoppingCart size={18} />
          Add to Cart
        </button>
      </div>
    </div>
    </div>
    </>
  );
};

const PopularProducts = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        const productsRef = collection(db, 'products');
        // Modified query to only filter by isPopular flag
        const q = query(
          productsRef, 
          where('isPopular', '==', true), 
          // Add salesCount as secondary sort
          orderBy('salesCount', 'desc'), 
          limit(8)
        );
        
        const querySnapshot = await getDocs(q);
        const popularProducts = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        // Ensure we have products even if sales count is 0
        if (popularProducts.length > 0) {
          setProducts(popularProducts);
        } else {
          // Fallback query without salesCount sorting if no results
          const fallbackQuery = query(
            productsRef, 
            where('isPopular', '==', true),
            limit(8)
          );
          const fallbackSnapshot = await getDocs(fallbackQuery);
          setProducts(fallbackSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          })));
        }
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
        {products.length > 0 ? (
          <Slider {...sliderSettings}>
            {products.map(product => (
              <div key={product.id} className="popular-product-slide">
                <ProductCard product={product} />
              </div>
            ))}
          </Slider>
        ) : (
          <p className="no-product">No popular products available at this time.</p>
        )}
      </div>
    </section>
  );
};

export default PopularProducts;