import React from 'react'
import { emitEvent, getSocketInstance } from './sockets.ts';

function RenderCrossRoads({ setCrossRoads, connectionState }) {
    //console.log('RV-->[RenderDestinations]: connectionState', JSON.stringify(connectionState));
    React.useEffect(() => {
        const fetchCrossRoads = async () => {
            try {
                console.log('HtWRenderCrossRoads-->[fetchCrossRoads]: Attempting to fetch crossroads...');
                const socket = await getSocketInstance(connectionState);
                if (socket) {
                    console.log('HtWRenderCrossRoads-->[fetchCrossRoads]: Using existing socket instance with ID:', socket.id);
                    
                    // Set up listeners first
                    socket.on('printIncroci', (data) => {
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
                    
                    // Now emit the request
                    console.log('HtWRenderCrossRoads-->[fetchCrossRoads]: Emitting listaIncroci request');
                    socket.emit('listaIncroci');
                } else {
                    console.error('HtWRenderCrossRoads-->[fetchCrossRoads]: Failed to get socket instance');
                }
            } catch (error) {
                console.error('HtWRenderCrossRoads-->[fetchCrossRoads]: Error fetching crossroads:', error);
            }
        };

        // Return a function to clean up the effect
        return () => {
            console.log('HtWRenderCrossRoads-->[useEffect cleanup]: Cleaning up socket listeners');
            const socket = getSocketInstance(connectionState);
            if (socket) {
                socket.off('printIncroci');
            }
        };
    }, [connectionState]);



  return null;
}

export default RenderCrossRoads
