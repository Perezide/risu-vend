import React, { useState } from 'react';
import { 
  X, 
  Home, 
  User, 
  ShoppingCart, 
  Heart, 
  Contact, 
  PlusSquare, 
  LogOut, 
  Clipboard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import './SideNav.css';
import useAdminStatus from '../hooks/useAdminStatus';
import { useProductSearch } from '../hooks/useProductSearch';

// Sidebar Component (for small screens)
const SideNav = ({ isOpen, toggleSideNav }) => {
  const { isAdmin } = useAdminStatus()
  const navigate = useNavigate()
  const { user, logout, isLoading } = useAuthContext();
  // const [isCategoriessOpen, setIsCategoriesOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { searchResults, isSearching, searchProducts } = useProductSearch();

  // Add this new function
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchProducts(value);
  };

  // Predefined categories (you can fetch these dynamically from your backend)
  // const categories = [
  //   { id: '52ZfKnEsirEzVO08XCKZ', name: 'Jersey Shop' }
  // ];

  // const toggleCategories = () => {
  //   setIsCategoriesOpen(!isCategoriessOpen);
  // };

  const handleLogout = () => {
    logout();
    toggleSideNav(); // Close side nav after logout
    navigate('/')
  };

  return (
    <>
      {isOpen && <div className="overlay" onClick={toggleSideNav} />}

      <div className={`sidenav ${isOpen ? 'open' : ''}`}>
        <div className="sidenav-header">
          <h2 className="menu-title">Menu</h2>
          <button onClick={toggleSideNav} className="close-button">
            <X size={24} />
          </button>
        </div>

        <div className="sidenav-search">
    <div className="search-container">
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Search products..."
        className="search-input"
      />
      {searchTerm && (
        <div className="search-results-list">
          {isSearching ? (
            <div className="search-loading">Searching...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map(product => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="search-result-item"
                onClick={() => {
                  setSearchTerm('');
                  toggleSideNav();
                }}
              >
                <img src={product.imageUrl} alt={product.name} className="search-result-image" />
                <div className="search-result-details">
                  <span className="search-result-name">{product.name}</span>
                  <span className="search-result-category">{product.categoryName}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="no-results">No products found</div>
          )}
        </div>
      )}
    </div>
  </div>

        <nav>
          <ul>
            {/* Main Navigation Items */}
            <li>
              <Link to="/" onClick={toggleSideNav}>
                <Home size={20} /> Home
              </Link>
            </li>

            {user ? (
              <>
                <li>
                  <Link to="/profile" onClick={toggleSideNav}>
                    <User size={20} /> Profile
                  </Link>
                </li>
              
                <li>
                  <Link to="/shoping-cart" onClick={toggleSideNav}>
                    <ShoppingCart size={20} /> Shopping Cart
                  </Link>
                </li>
                <li>
                  <Link to="/saved" onClick={toggleSideNav}>
                    <Heart size={20} /> Saved
                  </Link>
                </li>
                <li>
                  <Link to="/myorders" onClick={toggleSideNav}>
                    <Clipboard size={20} /> My Order
                  </Link>
                </li>
              </>
            ) : (
              <li>
                <Link to="/login" onClick={toggleSideNav}>
                  <User size={20} /> Login
                </Link>
                <Link to="/signup" onClick={toggleSideNav}>
                  <User size={20} /> Signup
                </Link>
              </li>
            )}

            {/* Categories Section */}
            {/* <li className="categories-section">
              <div 
                className="categories-header" 
                onClick={toggleCategories}
              >
                <Grid3x3 size={20} /> Categories
                <List 
                  size={16} 
                  className={`categories-toggle ${isCategoriessOpen ? 'rotated' : ''}`} 
                />
              </div>
              {isCategoriessOpen && (
                <ul className="subcategories">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link 
                        to={`/category/${category.id}`} 
                        onClick={toggleSideNav}
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li> */}

            <li>
              <Link to="/contact" onClick={toggleSideNav}>
                <Contact size={20} /> Contact Us
              </Link>
            </li>

            {/* Admin-only Links */}
            {isAdmin && (
              <>
                <li>
                  <Link to="/admin-dashboard" onClick={toggleSideNav}>
                    <PlusSquare size={20} /> Admin Dashboard
                  </Link>
                </li>
              </>
            )}

            {/* Logout Button */}
            {user && (
              <li>
                <button 
                  onClick={handleLogout} 
                  className="logout-button"
                  disabled={isLoading}
                >
                  <LogOut size={20} /> 
                  {isLoading ? 'Logging out...' : 'Logout'}
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default SideNav;