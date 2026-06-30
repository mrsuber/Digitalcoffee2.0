import React, { createContext, useState, useContext, useEffect } from 'react';
import { adminAuthAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('admin');

    if (token && storedAdmin) {
      const adminData = JSON.parse(storedAdmin);
      console.log('Loading admin from localStorage:', adminData);

      // If role is missing, clear localStorage and force re-login
      if (!adminData.role) {
        console.warn('Admin data missing role field, clearing localStorage');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        setLoading(false);
        return;
      }

      setAdmin(adminData);
      setIsAuthenticated(true);
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await adminAuthAPI.login(email, password);

      if (response.success) {
        const { admin: adminData, accessToken } = response.data;

        localStorage.setItem('adminToken', accessToken);
        localStorage.setItem('admin', JSON.stringify(adminData));

        setAdmin(adminData);
        setIsAuthenticated(true);

        return { success: true, role: adminData.role };
      }

      return { success: false, message: 'Login failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    setAdmin(null);
    setIsAuthenticated(false);
  };

  const value = {
    admin,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
