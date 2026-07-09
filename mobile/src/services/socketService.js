import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

class SocketService {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.listeners = new Map();
    this.isConnected = false;
  }

  // Initialize socket connection
  async connect(userId) {
    if (this.socket?.connected && this.userId === userId) {
      console.log('🔌 Socket already connected for user', userId);
      return Promise.resolve();
    }

    // Disconnect any existing socket first
    if (this.socket) {
      console.log('🔌 Disconnecting existing socket before reconnecting');
      this.socket.disconnect();
      this.socket = null;
    }

    return new Promise((resolve, reject) => {
      try {
        this.userId = userId;
        const socketUrl = API_URL.replace('/api', ''); // Remove /api from URL

        console.log('🔌 Connecting to socket server:', socketUrl);

      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'], // Try websocket first (faster and more reliable)
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        timeout: 20000,
        autoConnect: true,
        forceNew: true,
        upgrade: true,
        rememberUpgrade: true,
        rejectUnauthorized: false, // Allow self-signed certificates in development
        secure: true,
        withCredentials: false,
        path: '/socket.io/', // Explicitly set the path
      });

      this.setupEventHandlers();

      // Register user after connection
      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
        console.log('   Transport used:', this.socket.io?.engine?.transport?.name);
        this.isConnected = true;
        this.registerUser();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', {
          message: error.message || error,
          type: error.type,
          description: error.description,
          context: error.context
        });
        // Log transport being used
        if (this.socket) {
          console.log('   Transport attempted:', this.socket.io?.engine?.transport?.name);
        }
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Socket reconnection attempt ${attemptNumber}`);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
        this.isConnected = true;
        this.registerUser();
      });

      this.socket.on('reconnect_failed', () => {
        console.error('❌ Socket reconnection failed after all attempts');
        this.isConnected = false;
        reject(new Error('Socket reconnection failed'));
      });

      // Resolve after successful connection or reject after timeout
      const connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.error('❌ Socket connection timeout (20s)');
          // Don't reject here - let reconnection logic handle it
          resolve(); // Resolve anyway to not block the app
        }
      }, 20000);

      // Clear timeout when connected
      this.socket.once('connect', () => {
        clearTimeout(connectionTimeout);
        resolve();
      });

    } catch (error) {
      console.error('❌ Error initializing socket:', error);
      reject(error);
    }
    });
  }

  // Register user with server
  registerUser() {
    if (this.socket && this.userId) {
      console.log('📝 Registering user with socket server:', this.userId);
      this.socket.emit('register-user', { userId: this.userId });
    }
  }

  // Setup event handlers
  setupEventHandlers() {
    if (!this.socket) return;

    // Registration confirmation
    this.socket.on('registration-confirmed', (data) => {
      console.log('✅ User registration confirmed:', data);
    });

    // Incoming instant call
    this.socket.on('incoming-instant-call', (data) => {
      console.log('📞 Incoming instant call:', data);
      this.notifyListeners('incoming-instant-call', data);
    });

    // Call cancelled by coach
    this.socket.on('call-cancelled', (data) => {
      console.log('❌ Call cancelled:', data);
      this.notifyListeners('call-cancelled', data);
    });

    // Call answered by student (for coach)
    this.socket.on('call-answered', (data) => {
      console.log('✅ Call answered:', data);
      this.notifyListeners('call-answered', data);
    });

    // Call rejected by student (for coach)
    this.socket.on('call-rejected', (data) => {
      console.log('❌ Call rejected:', data);
      this.notifyListeners('call-rejected', data);
    });

    // Generic error handler
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.notifyListeners('error', error);
    });
  }

  // Add event listener
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // Remove event listener
  removeEventListener(event, callback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Notify all listeners for an event
  notifyListeners(event, data) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
      this.listeners.clear();
    }
  }

  // Check connection status
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Get socket instance (for WebRTC signaling)
  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
