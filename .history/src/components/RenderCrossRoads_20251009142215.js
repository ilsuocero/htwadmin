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
