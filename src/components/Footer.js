import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section brand">
            <h2 className="footer-logo">YourStore</h2>
            <p className="footer-tagline">Quality products for everyday life</p>
            <div className="social-links">
              <a href="https://facebook.com" className="social-link" aria-label="Facebook">
                <i className="fa fa-facebook"></i>
              </a>
              <a href="https://twitter.com" className="social-link" aria-label="Twitter">
                <i className="fa fa-twitter"></i>
              </a>
              <a href="https://instagram.com" className="social-link" aria-label="Instagram">
                <i className="fa fa-instagram"></i>
              </a>
              <a href="https://pinterest.com" className="social-link" aria-label="Pinterest">
                <i className="fa fa-pinterest"></i>
              </a>
            </div>
          </div>
          
          <div className="footer-section links">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/shop">Shop</a></li>
              <li><a href="/about">About Us</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
          
          <div className="footer-section categories">
            <h3>Categories</h3>
            <ul>
              <li><a href="/category/electronics">Electronics</a></li>
              <li><a href="/category/fashion">Fashion</a></li>
              <li><a href="/category/home">Home & Garden</a></li>
              <li><a href="/category/beauty">Beauty & Health</a></li>
              <li><a href="/category/toys">Toys & Games</a></li>
            </ul>
          </div>
          
          <div className="footer-section contact-info">
            <h3>Contact Us</h3>
            <ul>
              <li>
                <i className="fa fa-map-marker"></i>
                <span>123 Commerce St, Suite 100, Anytown, ST 12345</span>
              </li>
              <li>
                <i className="fa fa-phone"></i>
                <span>(123) 456-7890</span>
              </li>
              <li>
                <i className="fa fa-envelope"></i>
                <span>info@yourstore.com</span>
              </li>
              <li>
                <i className="fa fa-clock-o"></i>
                <span>Mon-Fri: 9AM-6PM, Sat: 10AM-4PM</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* <div className="footer-newsletter">
          <h3>Subscribe to our Newsletter</h3>
          <p>Get the latest updates, special offers and new product announcements</p>
          <form className="newsletter-form">
            <input 
              type="email" 
              placeholder="Your email address" 
              required
            />
            <button type="submit">Subscribe</button>
          </form>
        </div> */}
        
        <div className="footer-bottom">
          <div className="payment-methods">
            <span>We accept:</span>
            <div className="payment-icons">
              <i className="fa fa-cc-visa"></i>
              <i className="fa fa-cc-mastercard"></i>
              <i className="fa fa-cc-amex"></i>
              <i className="fa fa-cc-paypal"></i>
              <i className="fa fa-cc-discover"></i>
            </div>
          </div>
          
          <div className="copyright">
            <p>&copy; {currentYear} YourStore. All Rights Reserved.</p>
          </div>
          
          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms & Conditions</a>
            <a href="/shipping">Shipping Info</a>
            <a href="/returns">Returns & Refunds</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;