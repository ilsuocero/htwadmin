import React from 'react'
import { useSocket } from '../hooks/useSocket';

function RenderPathNetwork({setPathNetwork, connectionState }) {
    const { socketOperations, isConnected } = useSocket(connectionState);
    
    React.useEffect(() => {
        console.log('HtWRenderPathNetwork-->[useEffect connectionState]: connectionState changed', JSON.stringify(connectionState));
        
        if (connectionState && connectionState.isOnline && isConnected) {
            console.log('HtWRenderPathNetwork-->[useEffect connectionState]: Connection state is online and connected, fetching sentieri');
            
            // Set up listener for path data
            const cleanupListener = socketOperations.on('printSentieri', (data) => {
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
            
            // Emit the request
            console.log('HtWRenderPathNetwork-->[useEffect]: Emitting listaSentieri request');
            socketOperations.emit('listaSentieri');
            
            // Return cleanup function
            return () => {
                console.log('HtWRenderPathNetwork-->[useEffect cleanup]: Cleaning up socket listeners');
                if (cleanupListener) cleanupListener();
            };
        } else {
            console.log('HtWRenderPathNetwork-->[useEffect connectionState]: Connection state not ready or offline');
        }
                    });
                    
                    // Now emit the request
                    console.log('HtWRenderPathNetwork-->[fetchSentieri]: Emitting listaSentieri request');
                    socket.emit('listaSentieri');
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
            console.log('HtWRenderPathNetwork-->[useEffect connectionState]: Connection state not ready or offline');
        }

        // Return a function to clean up the effect
        return () => {
            console.log('HtWRenderPathNetwork-->[useEffect cleanup]: Cleaning up socket listeners');
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
