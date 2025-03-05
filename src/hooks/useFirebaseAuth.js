// useFirebaseAuth.js
import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const useFirebaseAuth = (userType = 'customer') => {
  const { user: auth0User, isAuthenticated, isLoading: auth0Loading } = useAuth0();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync Auth0 user with Firebase
  useEffect(() => {
    const syncUserWithFirebase = async () => {
      if (!isAuthenticated || auth0Loading) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Check if user already exists in Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', auth0User.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // User exists, get their data
          const userData = querySnapshot.docs[0].data();
          setFirebaseUser({
            id: querySnapshot.docs[0].id,
            ...userData
          });
        } else {
          // User doesn't exist in Firestore, create them
          const newUserData = {
            email: auth0User.email,
            userName: auth0User.name || auth0User.email.split('@')[0],
            userType,
            createdAt: new Date()
          };
          
          const docRef = await addDoc(collection(db, 'users'), newUserData);
          
          setFirebaseUser({
            id: docRef.id,
            ...newUserData
          });
        }
      } catch (err) {
        console.error('Error syncing user with Firebase:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    syncUserWithFirebase();
  }, [auth0User, isAuthenticated, auth0Loading, userType]);

  // Function to update user profile
  const updateUserProfile = async (updatedData) => {
    if (!firebaseUser || !firebaseUser.id) {
      throw new Error('No user found to update');
    }

    try {
      const userRef = doc(db, 'users', firebaseUser.id);
      await updateDoc(userRef, {
        ...updatedData,
        updatedAt: new Date()
      });

      // Update local state
      setFirebaseUser({
        ...firebaseUser,
        ...updatedData
      });

      return true;
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  };

  return {
    user: firebaseUser,
    isLoading: isLoading || auth0Loading,
    error,
    updateUserProfile
  };
};

export default useFirebaseAuth;