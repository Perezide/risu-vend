import { useEffect, useState } from 'react';
import { useAuthContext } from './useAuthContext';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const useAdminStatus = () => {
  const { user, firebaseUser } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const db = getFirestore();

    const checkAdminStatus = async () => {
      setIsLoading(true);
      try {
        // Check if we have a firebaseUser from context
        if (!firebaseUser || !firebaseUser.id) {
          setIsAdmin(false);
          return;
        }

        // Check admin status from Firestore using the ID from firebaseUser
        const userRef = doc(db, 'users', firebaseUser.id);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists() && userDoc.data().isAdmin === true) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        
        setError(null);
      } catch (err) {
        console.error('Admin status check error:', err);
        setIsAdmin(false);
        setError('Failed to verify admin status');
      } finally {
        setIsLoading(false);
      }
    };

    // Run the check when firebaseUser changes
    checkAdminStatus();
    
    return () => {
      // No cleanup needed for this simplified approach
    };
  }, [firebaseUser]);

  return { isAdmin, user, firebaseUser, isLoading, error };
};

export default useAdminStatus;