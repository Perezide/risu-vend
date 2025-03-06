import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  orderBy, 
  limit,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ShoppingCart } from 'lucide-react';
import { db, auth } from '../firebase/config';
import { toast } from 'react-hot-toast';
import './ShopsByCategory.css';

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
        price: product.price,
        quantity: 1,
        size: '',
        shopId: product.shopId,
        shopName: product.shopName,  // Make sure this is available
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
    <div onClick={handleProductClick} >
    <div className="shop-product-card">
      <div onClick={handleProductClick} className="shop-product-image-container">
        <img src={product.imageUrl} alt={product.name} className="shop-product-image" />
      </div>
      <div className="shop-product-info">
        <h4 className="shop-product-name">{product.name}</h4>
        <div className="shop-product-price">₦{product.price}</div>
      </div>
      <div className="shop-product-actions">
        <button onClick={handleAddToCart} className="shop-add-to-cart">
          <ShoppingCart size={16} />
        </button>
      </div>
    </div>
    </div>
    </>
  );
};

const ShopSection = ({ shop, products }) => {
  const navigate = useNavigate();

  const handleShopClick = () => {
    navigate(`/shop/${shop.id}`);
  };

  return (
    <div className="shop-section">
      <div className="shop-header">
        <div className="shop-info">
          <h3 className="shop-name" onClick={handleShopClick}>{shop.shopName}</h3>
          <span className="shop-category">{shop.category}</span>
        </div>
        <button className="view-all-button" onClick={handleShopClick}>
          View All Products
        </button>
      </div>
      
      <div className="shop-products-grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

const ShopsByCategory = () => {
  const [shopsWithProducts, setShopsWithProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShopsWithProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch featured shops - UPDATED to only get approved shops
        const shopsRef = collection(db, 'shops');
        const shopsQuery = query(
          shopsRef,
          where('active', '==', true),
          where('approved', '==', true),  // Add approved condition
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        
        const shopsSnapshot = await getDocs(shopsQuery);
        const shops = shopsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // For each shop, fetch their products
        const shopsData = await Promise.all(
          shops.map(async (shop) => {
            const productsRef = collection(db, 'products');
            const productsQuery = query(
              productsRef,
              where('shopId', '==', shop.id),
              limit(4)
            );
            
            const productsSnapshot = await getDocs(productsQuery);
            const products = productsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              shopName: shop.shopName // Add shopName to product data for cart
            }));
            
            return {
              shop,
              products
            };
          })
        );
        
        // Only include shops that have products
        const shopsWithProductsFiltered = shopsData.filter(
          shopData => shopData.products.length > 0
        );
        
        setShopsWithProducts(shopsWithProductsFiltered);
      } catch (err) {
        console.error("Error fetching shops and products:", err);
        setError("Failed to load shops and products");
      } finally {
        setLoading(false);
      }
    };
    
    fetchShopsWithProducts();
  }, []);

  if (loading) {
    return <div className="shops-loading">Loading shops and products...</div>;
  }

  if (error) {
    return <div className="shops-error">{error}</div>;
  }

  if (shopsWithProducts.length === 0) {
    return <div className="no-shops">No shops available at the moment.</div>;
  }

  return (
    <section className="shops-by-category">
      <div className="shops-header">
        <h2>Shops by Category</h2>
        <p>Explore products from our featured shops</p>
      </div>
      
      <div className="shops-container">
        {shopsWithProducts.map(({ shop, products }) => (
          <ShopSection 
            key={shop.id} 
            shop={shop} 
            products={products} 
          />
        ))}
      </div>
    </section>
  );
};

export default ShopsByCategory;