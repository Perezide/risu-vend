import { useAuthContext } from './useAuthContext';
import { useAuth0 } from '@auth0/auth0-react';

export const useLogout = () => {
  const { dispatch } = useAuthContext();
  const { logout: auth0Logout } = useAuth0();
  
  const logout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('firebaseUser');
      
      // Logout from Auth0
      auth0Logout({ returnTo: window.location.origin });
      
      // Update the local state
      dispatch({ type: 'LOGOUT' });
      
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return { logout };
};