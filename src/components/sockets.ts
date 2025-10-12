import io, { Socket } from 'socket.io-client';
import ENV from '../ENV';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { ConnectionState } from '../types/geojson';

let socketInstance: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;

export const emitEvent = async (
  connectionState: ConnectionState, 
  eventName: string, 
  ...args: any[]
): Promise<Socket<DefaultEventsMap, DefaultEventsMap> | void> => {

    console.log('HtWsockets-->[emitEvent]: connectionState', JSON.stringify(connectionState));
    if (!connectionState.isOnline) {
        alert('Offline Please connect to the internet.');
        return;
    }

    // Log the token that will be used for Socket.io authentication
    console.log('HtWsockets-->[emitEvent]: Token to be used for Socket.io auth:', connectionState.tokenIO);
    console.log('HtWsockets-->[emitEvent]: Full auth object:', { token: connectionState.tokenIO });

    // Use relative URL when in development to leverage the proxy
    const serverUrl = process.env.NODE_ENV === 'development' ? '' : ENV.SERVER;
    console.log('HtWsockets-->[emitEvent]: Creating Socket.io connection to', serverUrl || 'proxy (relative URL)');
    
    socketInstance = io(serverUrl, {
        auth: { token: connectionState.tokenIO }, // No Bearer prefix - use raw JWT token
        transports: ['polling'], // Force polling to work with proxy
    });
    
    socketInstance.on('error', (error) => {
        console.error('HtWsockets-->[emitEvent error]: Socket error:', error);
    });

    socketInstance.on('connect_error', (error) => {
        console.error('HtWsockets-->[emitEvent connect_error]: Socket connection error:', error);
    });

    console.log('HtWsockets-->[emitEvent]: socketInstance created, emitting event:', eventName);
    socketInstance.emit(eventName, ...args, (ack: any) => {
        console.log('HtWsockets-->[emitEvent ack]: Event acknowledged by server:', ack);
    });

    return socketInstance;
};

export const getSocketInstance = async (
  connectionState: ConnectionState
): Promise<Socket<DefaultEventsMap, DefaultEventsMap> | null> => {
    if (!connectionState.isOnline) {
        alert('Offline Please connect to the internet.');
        return null;
    }

    // Check if existing socket instance is actually valid
    if (socketInstance) {
        const isSocketValid = socketInstance.connected && socketInstance.id !== undefined;
        console.log('HtWsockets-->[getSocketInstance]: Existing socket validation - connected:', socketInstance.connected, 'id:', socketInstance.id, 'valid:', isSocketValid);
        
        if (isSocketValid) {
            return socketInstance;
        } else {
            console.log('HtWsockets-->[getSocketInstance]: Existing socket is invalid, creating new connection');
            // Close the invalid connection
            socketInstance.close();
            socketInstance = null;
        }
    }

    // Create new socket instance with proper reconnection settings
    const serverUrl = process.env.NODE_ENV === 'development' ? '' : ENV.SERVER;
    console.log('HtWsockets-->[getSocketInstance]: Creating Socket.io connection to', serverUrl || 'proxy (relative URL)');
    
    socketInstance = io(serverUrl, {
        auth: { token: connectionState.tokenIO },
        transports: ['polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
    });

    // Add connection event handlers for better debugging
    socketInstance.on('connect', () => {
        console.log('HtWsockets-->[getSocketInstance connect]: Socket connected with ID:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
        console.log('HtWsockets-->[getSocketInstance disconnect]: Socket disconnected, reason:', reason);
    });

    socketInstance.on('connect_error', (error) => {
        console.error('HtWsockets-->[getSocketInstance connect_error]: Socket connection error:', error);
    });

    return socketInstance;
};
