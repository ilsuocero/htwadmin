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

  // Initialize socket connection
  const initializeConnection = useCallback(async () => {
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
