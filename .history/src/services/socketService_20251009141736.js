import { io } from 'socket.io-client';

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

  // Create new socket connection
  const URL = process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_SOCKET_URL 
    : 'http://localhost:4000';

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

