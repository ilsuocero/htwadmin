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

    console.log('RV-->[emitEvent]: Creating Socket.io connection to', ENV.SERVER);
    socketInstance = io(ENV.SERVER, {
        auth: { token: `Bearer ${connectionState.tokenIO}` },
    });
    
    socketInstance.on('connect', () => {
        console.log('RV-->[emitEvent]: Socket.io connected successfully, ID:', socketInstance?.id);
    });
    
    socketInstance.on('error', (error) => {
        console.error('RV-->[emitEvent]: Socket error:', error);
    });
    
    socketInstance.on('connect_error', (error) => {
        console.error('RV-->[emitEvent]: Socket connection error:', error);
    });

    console.log('RV-->[emitEvent]: socketInstance created, emitting event:', eventName);
    socketInstance.emit(eventName, ...args, (ack: any) => {
        console.log('RV-->[emitEvent]: Event acknowledged by server:', ack);
    });

    return socketInstance;
    if (!socketInstance) {
        socketInstance = io(ENV.SERVER, {
            auth: { token: `Bearer ${connectionState.tokenIO}` },
        });
    }

    return socketInstance;
};
