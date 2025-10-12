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
                }
            } catch (error) {
                console.error(error);
            }
            // Return a function to clean up the effect
            return () => {
                const socket = getSocketInstance();
                socket.off('printIncroci');
            };
        };

        if (connectionState) fetchCrossRoads();
    }, []);



  return null;
}

export default RenderCrossRoads