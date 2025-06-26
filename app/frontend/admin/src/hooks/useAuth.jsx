import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../utils/api';
import { getToken, setToken, removeToken, getUser, setUser, setCSRFToken } from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = getToken();
      if (token) {
        try {
          const response = await authAPI.verifyToken();
          setUserState(response.data.user);
          setUser(response.data.user);
          
          if (response.data.csrfToken) {
            setCSRFToken(response.data.csrfToken);
          }
        } catch (error) {
          removeToken();
          setUserState(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user, csrfToken } = response.data;
      
      setToken(token);
      setUser(user);
      setUserState(user);
      
      if (csrfToken) {
        setCSRFToken(csrfToken);
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeToken();
      setUserState(null);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};