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

    // Use relative URL when in development to leverage the proxy
    const serverUrl = process.env.NODE_ENV === 'development' ? '' : ENV.SERVER;
    console.log('HtWsockets-->[emitEvent]: Creating Socket.io connection to', serverUrl || 'proxy (relative URL)');
    
    socketInstance = io(serverUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });
    
    socketInstance.on('connect', () => {
        console.log('HtWsockets-->[emitEvent connect]: Socket.io connected successfully, ID:', socketInstance?.id);
        // Authenticate after connection is established
        if (connectionState.tokenIO) {
            console.log('HtWsockets-->[emitEvent connect]: Authenticating with token');
            socketInstance.emit('authenticate', { token: connectionState.tokenIO });
        }
    });
    
    socketInstance.on('error', (error) => {
        console.error('HtWsockets-->[emitEvent error]: Socket error:', error);
    });
    
    socketInstance.on('connect_error', (error) => {
        console.error('HtWsockets-->[emitEvent connect_error]: Socket connection error:', error);
    });

    socketInstance.on('authenticated', () => {
        console.log('HtWsockets-->[emitEvent authenticated]: Socket authenticated successfully');
        console.log('HtWsockets-->[emitEvent]: socketInstance created, emitting event:', eventName);
        socketInstance.emit(eventName, ...args, (ack: any) => {
            console.log('HtWsockets-->[emitEvent ack]: Event acknowledged by server:', ack);
        });
    });

    return socketInstance;
        // Use relative URL when in development to leverage the proxy
        const serverUrl = process.env.NODE_ENV === 'development' ? '' : ENV.SERVER;
        console.log('HtWsockets-->[getSocketInstance]: Creating Socket.io connection to', serverUrl || 'proxy (relative URL)');
        
        socketInstance = io(serverUrl, {
            auth: { token: `Bearer ${connectionState.tokenIO}` },
        });
    }

    return socketInstance;
};
