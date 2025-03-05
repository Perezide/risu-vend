import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  ShoppingCart, 
  User, 
  BookmarkPlus, 
  Search
} from 'lucide-react';
import useAdminStatus from '../hooks/useAdminStatus';
import { useAuthContext } from '../hooks/useAuthContext'; // Adjust import path as needed
import { useLogout } from '../hooks/useLogout'; // Adjust import path as needed
import { useProductSearch } from '../hooks/useProductSearch';
import './Header.css';

const Header = ({ toggleSideNav }) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { logout } = useLogout();
  const { isAdmin } = useAdminStatus();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const { searchResults, isSearching, searchProducts } = useProductSearch();

  const handleUserDropdownToggle = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const handleLogout = () => {
    logout();
    setIsUserDropdownOpen(false);
    navigate('/');
  };

    // Add this new function
    const handleSearch = (e) => {
      const value = e.target.value;
      setSearchTerm(value);
      searchProducts(value);
    };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <button 
            className="menu-button"
            onClick={toggleSideNav}
          >
            <Menu />
          </button>
          <Link to="/" className="logo">RiSU Vend</Link>
        </div>

        <div className="header-right">
    <div className="search-section">
      <button 
        className="search-icon"
        onClick={() => setIsSearchVisible(!isSearchVisible)}
      >
        <Search />
      </button>
      {isSearchVisible && (
        <div className="search-container">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search products..."
            className="search-input"
          />
          {searchTerm && (
            <div className="search-results-dropdown">
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
                      setIsSearchVisible(false);
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
      )}
    </div>
          <Link to="/cart" className="cart-icon">
            <ShoppingCart />
          </Link>
          <Link to="/saved" className="saved-icon">
            <BookmarkPlus />
          </Link>
          <div 
            className="user-dropdown user-icon"
            onClick={handleUserDropdownToggle}
          >
            <User />
            {isUserDropdownOpen && (
              <div className="user-menu">
                {user ? (
                  <>
                    <Link to="/profile" className="user-menu-item">Profile</Link>
                    <Link to="/orders" className="user-menu-item">My Orders</Link>
                    <div 
                      className="user-menu-item logout"
                      onClick={handleLogout}
                    >
                      Logout
                    </div>
                     {/* Admin-only Links */}
                      {isAdmin && (
                            <Link to="/admin-dashboard" className="user-menu-item">
                             Admin Dashboard
                            </Link>
                      )}

                  </>
                ) : (
                  <>
                    <Link to="/login" className="user-menu-item">Login</Link>
                    <Link to="/user-signup" className="user-menu-item">User Signup</Link>
                    <Link to="/vendor-signup" className="user-menu-item">Vendor Signup</Link>

                    <div 
                      className="user-menu-item logout"
                      onClick={handleLogout}
                    >
                      Logout
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;