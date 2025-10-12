import React from 'react'
import { emitEvent, getSocketInstance } from './sockets.ts';

function RenderDestinations({ setDestNetwork, connectionState }) {
    //console.log('RV-->[RenderDestinations]: connectionState', JSON.stringify(connectionState));
    React.useEffect(() => {
        const fetchDestinations = async () => {
            try {
                console.log('HtWRenderDestinations-->[fetchDestinations]: Attempting to fetch destinations...');
                const socket = await getSocketInstance(connectionState);
                if (socket) {
                    console.log('HtWRenderDestinations-->[fetchDestinations]: Using existing socket instance with ID:', socket.id);
                    
                    // Set up listeners first
                    socket.on('printDestinazioni', (data) => {
                            "type": "FeatureCollection",
                            "name": "nodi",
                            "crs": { "type": "name", "properties": { "name": "Destinations" } },
                            "features": data
                        };
                        setDestNetwork(destinazioni);;
                    });
                }
            } catch (error) {
                console.error(error);
            }
            // Return a function to clean up the effect
            return () => {
                const socket = getSocketInstance();
                socket.off('printDestinazioni');
            };
        };

        if (connectionState) fetchDestinations();
    }, []);



  return null;
}

export default RenderDestinations