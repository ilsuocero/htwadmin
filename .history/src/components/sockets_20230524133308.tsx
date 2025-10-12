import { Alert  from 'react-alert';
import AsyncStorage from 'react';
import io, { Socket } from 'socket.io-client';
import ENV from '../ENV';
import { DefaultEventsMap } from '@socket.io/component-emitter';

let socketInstance: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;

export const emitEvent = async (eventName, ...args) => {
    const connectionStateTxt = await AsyncStorage.getItem('connectionState');
    const connectionState = JSON.parse(connectionStateTxt);

    if (!connectionState.isOnline) {
        Alert.alert('Offline', 'Please connect to the internet.');
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

export const getSocketInstance = async () => {
    //if (!socketInstance) {
    const connectionStateTxt = await AsyncStorage.getItem('connectionState');
    const connectionState = JSON.parse(connectionStateTxt);

    if (!connectionState.isOnline) {
        Alert.alert('Offline', 'Please connect to the internet.');
        return null;
    }

    socketInstance = io(ENV.SERVER, {
        auth: { token: `Bearer ${connectionState.tokenIO}` },
    });
    // }

    return socketInstance;
};

export const getConnectionState = async () => {
    //if (!socketInstance) {
    const connectionStateTxt = await AsyncStorage.getItem('connectionState');
    const connectionState = JSON.parse(connectionStateTxt);
    //console.log('RV-[Socket] getConnectionState:', connectionState);
    return connectionState;
};

module.exports = { emitEvent, getSocketInstance, getConnectionState };
