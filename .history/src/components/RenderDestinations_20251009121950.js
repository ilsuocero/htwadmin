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
                        console.log('HtWRenderDestinations-->[printDestinazioni]: Received destinations data, features count:', data?.length || 0);
                        var destinazioni =
                        {
                            "type": "FeatureCollection",
                            "name": "nodi",
                            "crs": { "type": "name", "properties": { "name": "Destinations" } },
                            "features": data
                        };
                        setDestNetwork(destinazioni);
                    });
                    
                    // Now emit the request
                    console.log('HtWRenderDestinations-->[fetchDestinations]: Emitting listaDestinazioni request');
                    socket.emit('listaDestinazioni');
                } else {
                    console.error('HtWRenderDestinations-->[fetchDestinations]: Failed to get socket instance');
                }
            } catch (error) {
        if (connectionState) fetchDestinations();
    }, []);



  return null;
}

export default RenderDestinations