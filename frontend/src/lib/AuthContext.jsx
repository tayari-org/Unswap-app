import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const authenticated = await api.auth.isAuthenticated();
      if (authenticated) {
        const currentUser = await api.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      if (error.status === 401 || error.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      api.auth.logout(window.location.href);
    } else {
      localStorage.removeItem('unswap_token');
    }
  };

  const navigateToLogin = () => {
    api.auth.redirectToLogin(window.location.href);
  };

  const isVerified = user?.verification_status === 'verified' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isVerified,
      isLoadingAuth,
      isLoadingPublicSettings: false, // no longer async — always false
      authError,
      appPublicSettings: null,
      logout,
      navigateToLogin,
      checkAppState: checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
