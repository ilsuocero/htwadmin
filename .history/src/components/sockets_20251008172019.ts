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

    console.log('RV-->[emitEvent]: connectionState', JSON.stringify(connectionState));
    if (!connectionState.isOnline) {
        alert('Offline Please connect to the internet.');
        return;
    }

    socketInstance = io(ENV.SERVER, {
        auth: { token: `Bearer ${connectionState.tokenIO}` },
    });
    socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
    });

    console.log('RV-->[emitEvent]: socketInstance', socketInstance);
    socketInstance.emit(eventName, ...args, (ack: any) => {
        console.log('Event acknowledged by server:', ack);
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

    if (!socketInstance) {
        socketInstance = io(ENV.SERVER, {
            auth: { token: `Bearer ${connectionState.tokenIO}` },
        });
    }

    return socketInstance;
};
