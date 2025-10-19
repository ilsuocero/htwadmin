import React from 'react'

function RenderDestinations({ dispatch, connectionState, socketOperations, isConnected }) {
    
    React.useEffect(() => {
        console.log('🎯 HtWRenderDestinations-->[useEffect connectionState]: connectionState changed', JSON.stringify(connectionState));
        console.log('🎯 HtWRenderDestinations-->[useEffect connectionState]: isConnected:', isConnected);
        
        if (connectionState && connectionState.isOnline && isConnected) {
            console.log('🎯 HtWRenderDestinations-->[useEffect connectionState]: Connection state is online and connected, fetching destinations');
            
            // Set up listener for destinations data
            const cleanupListener = socketOperations.on('printDestinazioni', (data) => {
                console.log('HtWRenderDestinations-->[printDestinazioni]: Received destinations data, features count:', data?.length || 0);
                var destinazioni =
                {
                    "type": "FeatureCollection",
                    "name": "nodi",
                    "crs": { "type": "name", "properties": { "name": "Destinations" } },
                    "features": data
                };
                dispatch({ type: 'SET_DESTINATIONS', payload: destinazioni });
            });
            
            // Emit the request
            console.log('HtWRenderDestinations-->[useEffect]: Emitting listaDestinazioni request');
            socketOperations.emit('listaDestinazioni');
            
            // Return cleanup function
            return () => {
                console.log('HtWRenderDestinations-->[useEffect cleanup]: Cleaning up socket listeners');
                if (cleanupListener) cleanupListener();
            };
        } else {
            console.log('HtWRenderDestinations-->[useEffect connectionState]: Connection state not ready or offline - isConnected:', isConnected);
        }
    }, [connectionState, isConnected, socketOperations, dispatch]);



  return null;
}

export default RenderDestinations
