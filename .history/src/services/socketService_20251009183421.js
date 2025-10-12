import { io } from 'socket.io-client';
import ENV from '../ENV';

// Global socket instance - true singleton
let socketInstance = null;
let connectionStateRef = null;

/**
 * Creates and manages a single Socket.io connection instance
 * Using ENV socketParam configuration exactly
 */
export const createSocket = (connectionState) => {
  // Store the latest connection state
  connectionStateRef = connectionState;
  
  console.log('🚀 HtWSocketService-->[createSocket]: Called with connectionState:', 
    connectionState ? JSON.stringify(connectionState) : 'NULL');
  
  // If we already have a valid socket instance, return it
  if (socketInstance && socketInstance.connected && socketInstance.id) {
    console.log('🚀 HtWSocketService-->[createSocket]: Returning existing socket instance with ID:', socketInstance.id);
    return socketInstance;
  }

  // Close existing invalid connection
  if (socketInstance) {
    console.log('🚀 HtWSocketService-->[createSocket]: Closing invalid existing connection');
    socketInstance.close();
    socketInstance = null;
  }

  // Create new socket connection using proxy configuration
  // Use relative URL to leverage the proxy in development
  const URL = process.env.NODE_ENV === 'development' ? '' : ENV.SERVER;
  console.log('🚀 HtWSocketService-->[createSocket]: Creating new socket connection to:', URL || 'proxy');
  console.log('🚀 HtWSocketService-->[createSocket]: Using auth token:', 
    connectionState?.tokenIO ? 'PRESENT' : 'MISSING');
  
  // Use ENV.socketParam configuration but force polling transport
  // since the server doesn't support WebSocket
  socketInstance = io(URL, {
    ...ENV.socketParam,
    transports: ['polling'], // Force polling since WebSocket is not supported
    auth: {
      token: connectionState?.tokenIO || ''
    },
    autoConnect: false, // Manual connection control
    withCredentials: true, // Include credentials for CORS
    path: '/socket.io/', // Explicit path for Socket.io
    forceNew: false, // Don't force new connection - reuse if possible
    reconnection: true, // Enable reconnection for transport errors
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Setup global event listeners
  setupSocketEventListeners(socketInstance);

  console.log('🚀 HtWSocketService-->[createSocket]: Socket created, calling connect()');
  // Connect the socket
  socketInstance.connect();

  return socketInstance;
  socket.on('connect', () => {
    console.log('HtWSocketService-->[connect]: Socket connected with ID:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('HtWSocketService-->[disconnect]: Socket disconnected. Reason:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('HtWSocketService-->[connect_error]: Connection failed:', error.message);
    
    // Handle specific error types
    if (error.message.includes('unauthorized') || error.message.includes('invalid')) {
      console.error('HtWSocketService-->[connect_error]: Authentication failed, token may be expired');
    }
  });

  socket.on('error', (error) => {
    console.error('HtWSocketService-->[error]: Socket error:', error);
  });
};

/**
 * Gets the current socket instance
 */
export const getSocketInstance = () => {
  return socketInstance;
};

/**
 * Disconnects and cleans up the socket instance
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    console.log('HtWSocketService-->[disconnectSocket]: Disconnecting socket');
    socketInstance.disconnect();
    socketInstance = null;
  }
};

/**
 * Reconnects the socket with new connection state
 */
export const reconnectSocket = (connectionState) => {
  console.log('HtWSocketService-->[reconnectSocket]: Reconnecting socket with new connection state');
  disconnectSocket();
  return createSocket(connectionState);
};
