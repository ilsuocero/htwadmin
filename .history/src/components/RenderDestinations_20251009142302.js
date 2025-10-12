import React from 'react'
import { useSocket } from '../hooks/useSocket';

function RenderDestinations({ setDestNetwork, connectionState }) {
    const { socketOperations, isConnected } = useSocket(connectionState);
    
    React.useEffect(() => {
        console.log('HtWRenderDestinations-->[useEffect connectionState]: connectionState changed', JSON.stringify(connectionState));
        
        if (connectionState && connectionState.isOnline && isConnected) {
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
                console.error('HtWRenderDestinations-->[fetchDestinations]: Error fetching destinations:', error);
            }
        };

        // Return a function to clean up the effect
        return () => {
            console.log('HtWRenderDestinations-->[useEffect cleanup]: Cleaning up socket listeners');
            const socket = getSocketInstance(connectionState);
            if (socket) {
                socket.off('printDestinazioni');
            }
        };
    }, [connectionState]);



  return null;
}

export default RenderDestinations
