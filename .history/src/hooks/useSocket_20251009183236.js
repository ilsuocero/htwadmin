import { useState, useEffect, useCallback, useRef } from 'react';
import { createSocket, getSocketInstance, disconnectSocket, reconnectSocket } from '../services/socketService';

/**
 * Custom hook for managing Socket.io connections and operations
 * Provides centralized socket management for the entire application
 */
export const useSocket = (connectionState) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  // Debug: Log when useSocket is called
  console.log('🚀 HtWuseSocket-->[constructor]: useSocket called with connectionState:', 
    if (!connectionState?.tokenIO) {
      setError('No authentication token available');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      console.log('HtWuseSocket-->[initializeConnection]: Initializing socket connection');

      // Create or get existing socket instance
      const socketInstance = createSocket(connectionState);
      socketRef.current = socketInstance;
      setSocket(socketInstance);

      // Setup connection state listeners
      setupConnectionListeners(socketInstance);

    } catch (err) {
      console.error('HtWuseSocket-->[initializeConnection]: Error initializing connection:', err);
      setError(`Connection failed: ${err.message}`);
      setIsConnecting(false);
    }
  }, [connectionState]);

  // Setup connection state listeners
  const setupConnectionListeners = useCallback((socketInstance) => {
    socketInstance.on('connect', () => {
      console.log('HtWuseSocket-->[connect]: Socket connected');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('HtWuseSocket-->[disconnect]: Socket disconnected. Reason:', reason);
      setIsConnected(false);
      setIsConnecting(false);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, attempt to reconnect
        setTimeout(() => {
          console.log('HtWuseSocket-->[disconnect]: Attempting to reconnect after server disconnect');
          reconnectSocket(connectionState);
        }, 1000);
      }
    });

    socketInstance.on('connect_error', (err) => {
      console.error('HtWuseSocket-->[connect_error]: Connection error:', err.message);
      setIsConnected(false);
      setIsConnecting(false);
      
      // Handle specific error types
      if (err.message.includes('unauthorized') || err.message.includes('invalid')) {
        setError('Authentication failed. Please check your credentials.');
      } else {
        setError(`Connection failed: ${err.message}`);
      }
    });
  }, [connectionState]);

  // Reconnect with new connection state
  const reconnect = useCallback(() => {
    console.log('HtWuseSocket-->[reconnect]: Manual reconnection requested');
    reconnectSocket(connectionState);
  }, [connectionState]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    console.log('HtWuseSocket-->[disconnect]: Manual disconnection requested');
    disconnectSocket();
    setIsConnected(false);
    setSocket(null);
    socketRef.current = null;
  }, []);

  // CRUD operations for components
  const socketOperations = {
    // Emit event and wait for response
    emitWithCallback: useCallback((event, data, callback) => {
      if (socketRef.current && isConnected) {
        console.log(`HtWuseSocket-->[emitWithCallback]: Emitting ${event} with data:`, data);
        socketRef.current.emit(event, data, callback);
      } else {
        console.error(`HtWuseSocket-->[emitWithCallback]: Cannot emit ${event} - socket not connected`);
        if (callback) callback(new Error('Socket not connected'));
      }
    }, [isConnected]),

    // Emit event without waiting for response
    emit: useCallback((event, data) => {
      if (socketRef.current && isConnected) {
        console.log(`HtWuseSocket-->[emit]: Emitting ${event} with data:`, data);
        socketRef.current.emit(event, data);
      } else {
        console.error(`HtWuseSocket-->[emit]: Cannot emit ${event} - socket not connected`);
      }
    }, [isConnected]),

    // Listen to events
    on: useCallback((event, callback) => {
      if (socketRef.current) {
        console.log(`HtWuseSocket-->[on]: Setting up listener for ${event}`);
        socketRef.current.on(event, callback);
        
        // Return cleanup function
        return () => {
          if (socketRef.current) {
            socketRef.current.off(event, callback);
          }
        };
      }
    }, []),

    // Remove event listener
    off: useCallback((event, callback) => {
      if (socketRef.current) {
        console.log(`HtWuseSocket-->[off]: Removing listener for ${event}`);
        socketRef.current.off(event, callback);
      }
    }, []),

    // Remove all listeners for an event
    removeAllListeners: useCallback((event) => {
      if (socketRef.current) {
        console.log(`HtWuseSocket-->[removeAllListeners]: Removing all listeners for ${event}`);
        socketRef.current.removeAllListeners(event);
      }
    }, [])
  };

  // Initialize connection when connectionState changes
  useEffect(() => {
    if (!connectionState) {
      console.log('HtWuseSocket-->[useEffect]: No connection state provided, skipping initialization');
      return;
    }
    
    if (connectionState?.tokenIO && connectionState.isOnline) {
      console.log('HtWuseSocket-->[useEffect]: Connection state changed, initializing connection');
      initializeConnection();
    } else if (!connectionState?.isOnline) {
      console.log('HtWuseSocket-->[useEffect]: Connection state offline, disconnecting');
      disconnect();
    }
  }, [connectionState?.tokenIO, connectionState?.isOnline, initializeConnection, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('HtWuseSocket-->[useEffect cleanup]: Cleaning up socket hook');
      // Note: We don't disconnect here to maintain the single connection
      // The socket service manages the singleton instance
    };
  }, []);

  return {
    socket,
    isConnected,
    isConnecting,
    error,
    socketOperations,
    reconnect,
    disconnect
  };
};
