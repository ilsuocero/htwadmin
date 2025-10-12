import React from 'react'
import { useSocket } from '../hooks/useSocket';

function RenderCrossRoads({ setCrossRoads, connectionState }) {
    const { socketOperations, isConnected } = useSocket(connectionState);
    
    React.useEffect(() => {
        console.log('HtWRenderCrossRoads-->[useEffect connectionState]: connectionState changed', JSON.stringify(connectionState));
        
        if (connectionState && connectionState.isOnline && isConnected) {
            console.log('HtWRenderCrossRoads-->[useEffect connectionState]: Connection state is online and connected, fetching crossroads');
            
            // Set up listener for crossroads data
            const cleanupListener = socketOperations.on('printIncroci', (data) => {
                var incroci =
                {
                    "type": "FeatureCollection",
                    "name": "incroci",
                    "crs": { "type": "name", "properties": { "name": "Destinations" } },
                    "features": data
                };
                console.log('HtWRenderCrossRoads-->[printIncroci]: Received crossroads data, features count:', data?.length || 0);
                setCrossRoads(incroci);
            });
            
            // Emit the request
            console.log('HtWRenderCrossRoads-->[useEffect]: Emitting listaIncroci request');
            socketOperations.emit('listaIncroci');
            
            // Return cleanup function
            return () => {
                console.log('HtWRenderCrossRoads-->[useEffect cleanup]: Cleaning up socket listeners');
                if (cleanupListener) cleanupListener();
            };
        } else {
            console.log('HtWRenderCrossRoads-->[useEffect connectionState]: Connection state not ready or offline');
        }
    }, [connectionState, isConnected, socketOperations, setCrossRoads]);



  return null;
}

export default RenderCrossRoads
