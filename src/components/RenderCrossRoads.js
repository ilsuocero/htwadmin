import React from 'react'

function RenderCrossRoads({ setCrossRoads, connectionState, socketOperations, isConnected }) {
    
    React.useEffect(() => {
        console.log('🚀 HtWRenderCrossRoads-->[useEffect connectionState]: connectionState changed', JSON.stringify(connectionState));
        console.log('🚀 HtWRenderCrossRoads-->[useEffect connectionState]: isConnected:', isConnected);
        
        if (connectionState && connectionState.isOnline && isConnected) {
            console.log('🚀 HtWRenderCrossRoads-->[useEffect connectionState]: Connection state is online and connected, fetching crossroads');
            
            // Set up listener for crossroads data
            const cleanupListener = socketOperations.on('printCrossRoads', (data) => {
                console.log('HtWRenderCrossRoads-->[printCrossRoads]: Received crossroads data, features count:', data?.length || 0);
                var crossroads =
                {
                    "type": "FeatureCollection",
                    "name": "crossroads",
                    "crs": { "type": "name", "properties": { "name": "crossroads" } },
                    "features": data
                };
                setCrossRoads(crossroads);
            });
            
            // Emit the request
            console.log('HtWRenderCrossRoads-->[useEffect]: Emitting listaCrossRoads request');
            socketOperations.emit('listCrossRoads');
            
            // Return cleanup function
            return () => {
                console.log('HtWRenderCrossRoads-->[useEffect cleanup]: Cleaning up socket listeners');
                if (cleanupListener) cleanupListener();
            };
        } else {
            console.log('HtWRenderCrossRoads-->[useEffect connectionState]: Connection state not ready or offline - isConnected:', isConnected);
        }
    }, [connectionState, isConnected, socketOperations, setCrossRoads]);



  return null;
}

export default RenderCrossRoads
