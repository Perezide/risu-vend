import { createContext, useReducer, useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth0 } from '@auth0/auth0-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export const AuthContext = createContext();

export const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, authIsReady: true };
    case 'LOGOUT':
      return { ...state, user: null, firebaseUser: null };
    case 'AUTH_IS_READY':
      return { ...state, user: action.payload, authIsReady: true };
    case 'SET_FIREBASE_USER':
      // Store firebaseUser in localStorage when updated
      localStorage.setItem('firebaseUser', JSON.stringify(action.payload));
      return { ...state, firebaseUser: action.payload };
    default:
      return state;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, { 
    user: null,
    firebaseUser: null,
    authIsReady: false
  });
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Auth0 hooks
  const { 
    user: auth0User, 
    isAuthenticated, 
    isLoading: auth0Loading,
    loginWithRedirect,
    logout: auth0Logout
  } = useAuth0();

  // Initialize state from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('firebaseUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        dispatch({ type: 'SET_FIREBASE_USER', payload: parsedUser });
        
        // Also set auth ready if we have stored user data
        dispatch({ type: 'AUTH_IS_READY', payload: { email: parsedUser.email } });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('firebaseUser');
      }
    }
  }, []);

  // Traditional Firebase auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      dispatch({ type: 'AUTH_IS_READY', payload: user });
      if (user) {
        dispatch({ type: 'LOGIN', payload: user });
        
        // When Firebase authenticates, check if user exists in Firestore
        const fetchFirestoreUser = async () => {
          try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', user.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const userData = querySnapshot.docs[0].data();
              const userWithId = {
                id: querySnapshot.docs[0].id,
                ...userData
              };
              
              dispatch({ type: 'SET_FIREBASE_USER', payload: userWithId });
            }
          } catch (error) {
            console.error('Error fetching Firestore user:', error);
          }
        };
        
        fetchFirestoreUser();
      }
    });
    
    return () => unsub();
  }, []);

  // Auth0 user sync with Firestore
  useEffect(() => {
    const syncAuth0UserWithFirestore = async () => {
      if (!isAuthenticated || auth0Loading || isProcessing) return;
      
      try {
        setIsProcessing(true);
        
        // Check if Auth0 user exists in Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', auth0User.email));
        const querySnapshot = await getDocs(q);
        
        let userData;
        let userId;
        
        if (!querySnapshot.empty) {
          // User exists, get their data
          userData = querySnapshot.docs[0].data();
          userId = querySnapshot.docs[0].id;
          
          // Update state with Firestore user data
          const userWithId = {
            id: userId,
            ...userData
          };
          
          dispatch({ type: 'SET_FIREBASE_USER', payload: userWithId });
        } else {
          // If user doesn't exist in Firestore, don't create them automatically
          // We'll let the signup components handle that for proper user/vendor differentiation
          console.log('Auth0 user not found in Firestore. Waiting for signup process.');
        }
        
        // Update auth state with Auth0 user
        dispatch({ type: 'LOGIN', payload: auth0User });
        
      } catch (error) {
        console.error('Error syncing Auth0 user with Firestore:', error);
      } finally {
        setIsProcessing(false);
      }
    };
    
    syncAuth0UserWithFirestore();
  }, [isAuthenticated, auth0User, auth0Loading, isProcessing]);

  // Combined logout function
  const logout = async () => {
    // Clear localStorage
    localStorage.removeItem('firebaseUser');
    
    if (isAuthenticated) {
      // Auth0 logout
      auth0Logout({ returnTo: window.location.origin });
    }
    
    // Also dispatch local logout
    dispatch({ type: 'LOGOUT' });
  };

  console.log('AuthContext state:', state);
  
  // Provide both Auth0 and Firebase auth methods
  return (
    <AuthContext.Provider value={{ 
      ...state, 
      dispatch,
      login: loginWithRedirect,
      logout,
      isAuthenticated,
      isLoading: auth0Loading || isProcessing
    }}>
      {children}
    </AuthContext.Provider>
  );
};