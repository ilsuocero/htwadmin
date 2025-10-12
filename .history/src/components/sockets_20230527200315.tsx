//import AsyncStorage from '@react-native-async-storage/async-storage';
import io, { Socket } from 'socket.io-client';
import ENV from '../ENV';
import { DefaultEventsMap } from '@socket.io/component-emitter';

let socketInstance: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;

export const emitEvent = async(connectionState, eventName, ...args) => {
 

    if (!connectionState.isOnline) {
        alert('Offline', 'Please connect to the internet.');
        return;
    }
    //console.log('RV-->[emitEvent]: args:', ...args,);
    // if (!socketInstance) {
    // console.log('RV-->[emitEvent]: !socketInstance',);
    socketInstance = io(ENV.SERVER, {
        auth: { token: `Bearer ${connectionState.tokenIO}` },
    });
    // }
    //console.log('RV-->[emitEvent]: socketInstance',);
    socketInstance.emit(eventName, ...args);

    return socketInstance;
};

export const getSocketInstance = async (connectionState) => {
    //if (!socketInstance) {

    if (!connectionState.isOnline) {
        alert('Offline', 'Please connect to the internet.');
        return null;
    }

    socketInstance = io(ENV.SERVER, {
        auth: { token: `Bearer ${connectionState.tokenIO}` },
    });
    // }

    return socketInstance;
};

module.exports = { emitEvent, getSocketInstance };
