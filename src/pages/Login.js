import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import googleIcon from '../assets/google-icon.svg';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loginError, setLoginError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Get context data
  const { dispatch } = useContext(AuthContext);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Handle email/password login form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    
    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      // User is signed in
      const user = userCredential.user;
      
      // Find user in Firestore
      await fetchAndRedirectUser(user.email);
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Failed to login. Please check your email and password.');
      setIsLoading(false);
    }
  };
  
  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // The signed-in user info
      const user = result.user;
      
      // Find user in Firestore
      await fetchAndRedirectUser(user.email);
    } catch (error) {
      console.error('Google login error:', error);
      setLoginError('Failed to login with Google. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Fetch user data from Firestore and redirect based on user type
  const fetchAndRedirectUser = async (email) => {
    try {
      // Check if user exists in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // User exists, get their data
        const userData = querySnapshot.docs[0].data();
        const userWithId = {
          id: querySnapshot.docs[0].id,
          ...userData
        };
        
        // Update context with user data
        dispatch({ type: 'SET_FIREBASE_USER', payload: userWithId });
        dispatch({ type: 'LOGIN', payload: { email } });
        
        // Redirect based on user type
        if (userData.userType === 'vendor') {
          navigate('/vendor-dashboard');
        } else {
          navigate('/profile');
        }
      } else {
        // If user doesn't exist in Firestore, redirect to signup choice page
        navigate('/signup-choice');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoginError('Error retrieving your account information.');
      setIsLoading(false);
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="login-container loading">
        <div className="loader"></div>
        <p>Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome to RiSU Vend</h2>
          <p>Sign in to your account</p>
        </div>
        
        {loginError && (
          <div className="error-message">
            {loginError}
          </div>
        )}
        
        <form onSubmit={handleFormSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <div className="forgot-password">
            <button 
              type="button"
              className="text-button"
              onClick={() => navigate('/forgot-password')}
            >
              Forgot Password?
            </button>
          </div>
          
          <button 
            type="submit" 
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="divider">
          <span>or</span>
        </div>
        
        <button 
          onClick={handleGoogleLogin} 
          className="google-button"
          disabled={isLoading}
        >
          <img src={googleIcon} alt="Google" />
          <span>Sign in with Google</span>
        </button>
        
        <div className="login-footer">
          <p>
            Don't have an account?
          </p>
          <div className="signup-options">
            <button 
              className="signup-option-button"
              onClick={() => navigate('/user-signup')}
            >
              Customer Sign up
            </button>
            <button 
              className="signup-option-button vendor"
              onClick={() => navigate('/vendor-signup')}
            >
              Vendor Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;