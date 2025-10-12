import { io } from 'socket.io-client';
import ENV from '../ENV';

// Socket instance singleton
let socketInstance = null;

/**
 * Creates and manages a single Socket.io connection instance
 * Following Socket.IO v4 best practices with auth object
 */
export const createSocket = (connectionState) => {
  // If we already have a valid socket instance, return it
  if (socketInstance && socketInstance.connected && socketInstance.id) {
    console.log('HtWSocketService-->[createSocket]: Returning existing socket instance with ID:', socketInstance.id);
    return socketInstance;
  }

  // Close existing invalid connection
  if (socketInstance) {
    console.log('HtWSocketService-->[createSocket]: Closing invalid existing connection');
    socketInstance.close();
    socketInstance = null;
  }

  // Create new socket connection using ENV configuration
  const URL = ENV.SERVER;
  console.log('HtWSocketService-->[createSocket]: Creating new socket connection to:', URL);
  
  socketInstance = io(URL, {
    autoConnect: false, // Manual connection control
    auth: {
      token: connectionState?.tokenIO || ''
    },
    transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    secure: true, // Use secure connection for HTTPS
  });

  // Setup global event listeners
  setupSocketEventListeners(socketInstance);

  // Connect the socket
  socketInstance.connect();

  return socketInstance;
};

/**
 * Sets up global event listeners for the socket
 */
const setupSocketEventListeners = (socket) => {
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
