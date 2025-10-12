import React from 'react'
import { emitEvent, getSocketInstance } from './sockets.ts';

function RenderPathNetwork({setPathNetwork, connectionState }) {
    //console.log('RV-->[RenderPathNetwork]: connectionState', JSON.stringify(connectionState));
    React.useEffect(() => {
        console.log('HtWRenderPathNetwork-->[useEffect connectionState]: connectionState changed', JSON.stringify(connectionState));
        
        const fetchSentieri = async () => {
            try {
                console.log('HtWRenderPathNetwork-->[fetchSentieri]: Attempting to fetch sentieri...');
                const socket = await emitEvent(connectionState, 'listaSentieri');
                if (socket) {
                    console.log('HtWRenderPathNetwork-->[fetchSentieri]: Socket connected with ID:', socket.id);
                    socket.on('printSentieri', (data) => {
                        console.log('HtWRenderPathNetwork-->[printSentieri]: Received printSentieri data, features count:', data?.length || 0);
                        var sentieri =
                        {
                            "type": "FeatureCollection",
                            "name": "sentieri",
                            "crs": { "type": "name", "properties": { "name": "pathNetwork" } },
                            "features": data
                        };
                        setPathNetwork(sentieri);
                    });
                    
                    // Add error handling for socket
                    socket.on('error', (error) => {
                        console.error('HtWRenderPathNetwork-->[socket error]:', error);
                    });
                    
                    socket.on('connect_error', (error) => {
                        console.error('HtWRenderPathNetwork-->[socket connect_error]:', error);
                    });
                } else {
                    console.error('HtWRenderPathNetwork-->[fetchSentieri]: Failed to get socket instance');
                }
            } catch (error) {
                console.error('HtWRenderPathNetwork-->[fetchSentieri]: Error fetching sentieri:', error);
            }
        };

        if (connectionState && connectionState.isOnline) {
            console.log('HtWRenderPathNetwork-->[useEffect connectionState]: Connection state is online, fetching sentieri');
            fetchSentieri();
        } else {
            console.log('RV-->[RenderPathNetwork]: Connection state not ready or offline');
        }

        // Return a function to clean up the effect
        return () => {
            console.log('RV-->[RenderPathNetwork]: Cleaning up socket listeners');
            const socket = getSocketInstance(connectionState);
            if (socket) {
                socket.off('printSentieri');
                socket.off('error');
                socket.off('connect_error');
            }
        };
    }, [connectionState]);



  return null;
}

export default RenderPathNetwork
