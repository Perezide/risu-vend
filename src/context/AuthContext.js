import { createContext, useReducer, useEffect, useState } from 'react';
import { 
  auth, 
  db 
} from '../firebase/config';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs
} from 'firebase/firestore';

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
  const googleProvider = new GoogleAuthProvider();

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

  // Firebase auth state listener
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

  // Sign up with email/password
  const signup = async (email, password) => {
    setIsProcessing(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (!res) {
        throw new Error('Could not complete signup');
      }
      return res.user;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Login with email/password
  const login = async (email, password) => {
    setIsProcessing(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      return res.user;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Google sign in
  const signInWithGoogle = async () => {
    setIsProcessing(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      return res.user;
    } catch (error) {
      console.error("Error with Google sign-in:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Logout function
  const logout = async () => {
    // Clear localStorage
    localStorage.removeItem('firebaseUser');
    
    try {
      await signOut(auth);
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  };

  console.log('AuthContext state:', state);
  
  return (
    <AuthContext.Provider value={{ 
      ...state, 
      dispatch,
      signup,
      login,
      signInWithGoogle,
      logout,
      isLoading: isProcessing
    }}>
      {children}
    </AuthContext.Provider>
  );
};