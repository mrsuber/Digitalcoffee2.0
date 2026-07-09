import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import api from '../services/api';
import { notificationService } from '../services/firebase';
import socketService from '../services/socketService';

const AuthContext = createContext();

export const AuthProvider = ({ children, navigationRef }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const socketListenersSetup = useRef(false);

  // Load user from storage on app start
  useEffect(() => {
    loadUser();
  }, []);

  // Connect socket when user is authenticated
  useEffect(() => {
    console.log('🔍 AuthContext socket effect triggered:', {
      isAuthenticated,
      userId: user?.id,
      userName: user?.name
    });

    if (isAuthenticated && user?.id) {
      console.log('🔌 Initializing socket connection for user:', user.id);

      // Connect socket with error handling
      socketService.connect(user.id).catch(err => {
        console.error('❌ Socket connection failed in AuthContext:', err);
      });

      // Setup socket listeners once, after connection
      if (!socketListenersSetup.current && navigationRef) {
        setupSocketListeners();
        socketListenersSetup.current = true;
      }
    } else if (!isAuthenticated) {
      console.log('🔌 Disconnecting socket - user not authenticated');
      socketService.disconnect();
      socketListenersSetup.current = false;
    } else {
      console.log('⚠️ Socket not connecting - missing auth or user ID');
    }

    return () => {
      // Cleanup on unmount
      if (!isAuthenticated) {
        console.log('🧹 Cleanup: Disconnecting socket');
        socketService.disconnect();
      }
    };
  }, [isAuthenticated, user?.id]);

  // Setup socket event listeners for incoming calls
  const setupSocketListeners = () => {
    console.log('🔧 Setting up socket listeners with navigation');

    // Listen for incoming instant calls
    socketService.addEventListener('incoming-instant-call', (data) => {
      console.log('📞 [AuthContext] Incoming instant call received:', data);

      if (navigationRef?.current) {
        console.log('📱 Navigating to IncomingCall screen');
        navigationRef.current.navigate('IncomingCall', {
          sessionId: data.sessionId,
          coachName: data.coachName,
          roomId: data.roomId,
        });
      } else {
        console.error('❌ Navigation ref not available!');
      }
    });

    // Listen for call cancelled events
    socketService.addEventListener('call-cancelled', (data) => {
      console.log('❌ [AuthContext] Call cancelled:', data);

      if (navigationRef?.current) {
        // Go back if on IncomingCall screen
        navigationRef.current.goBack();
      }
    });

    console.log('✅ Socket listeners configured');
  };

  const loadUser = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const userData = await AsyncStorage.getItem('user');

      if (accessToken && refreshToken && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);

      if (response.success) {
        const { user: userData, accessToken, refreshToken } = response.data;

        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);

        // Register for push notifications and save FCM token
        try {
          const fcmToken = await notificationService.registerForPushNotifications();
          if (fcmToken) {
            await api.saveFCMToken(fcmToken);
            console.log('✅ FCM token registered and saved after login');
          }
        } catch (fcmError) {
          console.log('⚠️  FCM token registration skipped:', fcmError.message);
          // Continue even if FCM fails - not critical for login
        }

        return { success: true };
      }

      return { success: false, message: 'Login failed' };
    } catch (error) {
      // Log based on error type
      if (error.response?.status === 401) {
        // Invalid credentials - expected validation error, not a system error
        console.log('⚠️ Login validation failed:', error.response?.data?.message || 'Invalid credentials');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('❌ Login timeout - server not responding');
      } else if (!error.response) {
        console.error('❌ Login network error:', error.message);
      } else {
        console.error('❌ Login error:', error.response?.status, error.response?.data?.message || error.message);
      }

      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (email, password, name, subscriptionType = 'free') => {
    try {
      const response = await authAPI.register(email, password, name, subscriptionType);

      if (response.success) {
        const { user: userData, accessToken, refreshToken } = response.data;

        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);

        // Register for push notifications and save FCM token
        try {
          const fcmToken = await notificationService.registerForPushNotifications();
          if (fcmToken) {
            await api.saveFCMToken(fcmToken);
            console.log('✅ FCM token registered and saved');
          }
        } catch (fcmError) {
          console.log('⚠️  FCM token registration skipped:', fcmError.message);
          // Continue even if FCM fails - not critical for registration
        }

        return { success: true };
      }

      return { success: false, message: 'Registration failed' };
    } catch (error) {
      // Log based on error type
      if (error.response?.status === 400 || error.response?.status === 409) {
        // Validation error or email already exists - expected, not a system error
        console.log('⚠️ Registration validation failed:', error.response?.data?.message || 'Validation error');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('❌ Registration timeout - server not responding');
      } else if (!error.response) {
        console.error('❌ Registration network error:', error.message);
      } else {
        console.error('❌ Registration error:', error.response?.status, error.response?.data?.message || error.message);
      }

      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      // Get refresh token before clearing storage
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      // Disconnect socket before logout
      socketService.disconnect();

      // Call logout API to revoke refresh token
      if (refreshToken) {
        try {
          await authAPI.logout(refreshToken);
        } catch (error) {
          console.error('Logout API error:', error);
          // Continue with local logout even if API call fails
        }
      }

      // Clear local storage
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      // Reload user data from storage (it will be updated by API interceptor after successful requests)
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    refreshUser,
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
