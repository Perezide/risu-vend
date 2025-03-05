import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  doc,
  getDoc,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { ShoppingCart, Filter, ChevronDown } from 'lucide-react';
import { db, auth } from '../firebase/config';
import { toast } from 'react-hot-toast';
import './Shop.css';

const Shop = () => {
  const { shopId } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // Fetch shop and its products
  useEffect(() => {
    const fetchShopAndProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch shop details
        const shopDocRef = doc(db, 'shops', shopId);
        const shopDoc = await getDoc(shopDocRef);
        
        if (!shopDoc.exists()) {
          setError("Shop not found");
          setLoading(false);
          return;
        }
        
        const shopData = {
          id: shopDoc.id,
          ...shopDoc.data()
        };
        
        setShop(shopData);
        
        // Fetch shop's products
        const productsRef = collection(db, 'products');
        const productsQuery = query(
          productsRef,
          where('shopId', '==', shopId)
        );
        
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (err) {
        console.error("Error fetching shop and products:", err);
        setError("Failed to load shop and products");
      } finally {
        setLoading(false);
      }
    };
    
    if (shopId) {
      fetchShopAndProducts();
    }
  }, [shopId]);
  
  // Apply filters and sorting
  useEffect(() => {
    if (products.length > 0) {
      let filtered = [...products];
      
      // Apply price filter
      filtered = filtered.filter(product => 
        product.price >= priceRange.min && product.price <= priceRange.max
      );
      
      // Apply sorting
      switch (sortBy) {
        case 'newest':
          filtered.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
          break;
        case 'oldest':
          filtered.sort((a, b) => (a.createdAt?.toDate() || 0) - (b.createdAt?.toDate() || 0));
          break;
        case 'price-low':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'name-asc':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name-desc':
          filtered.sort((a, b) => b.name.localeCompare(a.name));
          break;
        default:
          break;
      }
      
      setFilteredProducts(filtered);
    }
  }, [products, sortBy, priceRange]);
  
  const handleAddToCart = async (product) => {
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
        shopId: shopId,
        shopName: shop.shopName,
        addedAt: serverTimestamp()
      });

      toast.success(`${product.name} has been added to your cart.`);
    } catch (error) {
      console.error("Error adding product to cart:", error);
      toast.error("Failed to add product to cart.");
    }
  };
  
  if (loading) {
    return <div className="shop-loading">Loading shop details...</div>;
  }
  
  if (error) {
    return <div className="shop-error">{error}</div>;
  }
  
  if (!shop) {
    return <div className="shop-not-found">Shop not found</div>;
  }
  
  return (
    <div className="shop-page">
      <div className="shop-header-banner" style={{ backgroundImage: shop.bannerUrl ? `url(${shop.bannerUrl})` : 'none' }}>
        <div className="shop-header-overlay">
          <div className="shop-header-content">
            <div className="shop-logo-container">
              {shop.logoUrl && <img src={shop.logoUrl} alt={`${shop.shopName} logo`} className="shop-logo" />}
            </div>
            <div className="shop-details">
              <h1 className="shop-title">{shop.shopName}</h1>
              <div className="shop-meta">
                <span className="shop-category">{shop.category}</span>
                {shop.location && <span className="shop-location">{shop.location}</span>}
              </div>
              <p className="shop-description">{shop.description}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="shop-container">
        <div className="shop-sidebar">
          <div className="filter-header" onClick={() => setFilterOpen(!filterOpen)}>
            <div className="filter-title">
              <Filter size={18} />
              <h3>Filters</h3>
            </div>
            <ChevronDown size={18} className={`filter-arrow ${filterOpen ? 'open' : ''}`} />
          </div>
          
          <div className={`filter-body ${filterOpen ? 'open' : ''}`}>
            <div className="filter-section">
              <h4>Price Range</h4>
              <div className="price-inputs">
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={priceRange.min} 
                  onChange={(e) => setPriceRange({...priceRange, min: parseInt(e.target.value) || 0})}
                />
                <span>to</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={priceRange.max} 
                  onChange={(e) => setPriceRange({...priceRange, max: parseInt(e.target.value) || 1000})}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="shop-main">
          <div className="shop-controls">
            <div className="product-count">
              {filteredProducts.length} Products
            </div>
            <div className="sort-controls">
              <label htmlFor="sort-select">Sort by:</label>
              <select 
                id="sort-select" 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>
          
          <div className="products-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div className="product-card" key={product.id}>
                  <div className="product-image-container">
                    <img src={product.imageUrl} alt={product.name} className="product-image" />
                    <div className="product-actions">
                      <button 
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart size={16} />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-price">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-products">
                <p>No products found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;