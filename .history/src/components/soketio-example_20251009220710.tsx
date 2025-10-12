    React.useEffect(() => {
        
        if (connectionState && connectionState.isOnline && isConnected) {
            console.log('🚀 NameFuntion-->[useEffect connectionState]: Connection state is online and connected, fetching ###');
            
            // Set up listener for crossroads data
            const cleanupListener = socketOperations.on('requestToServer', (data) => {
                console.log('NameFuntion-->[answerFromServer]: Received ### data, features count:', data?.length || 0);
                var results =
                {
                    "type": "FeatureCollection",
                    "name": "crossroads",
                    "crs": { "type": "name", "properties": { "name": "crossroads" } },
                    "features": data
                };
                setResults(results);
            });
            
            // Emit the request
            console.log('HtWRenderCrossRoads-->[useEffect]: Emitting answerFromServer request');
            socketOperations.emit('requestToServer'); //
            
            // Return cleanup function
            return () => {
                console.log('NameFuntion-->[useEffect cleanup]: Cleaning up socket listeners');
                if (cleanupListener) cleanupListener();
            };
        } else {
            console.log('HtWRenderCrossRoads-->[useEffect connectionState]: Connection state not ready or offline - isConnected:', isConnected);
        }
    }, [connectionState, isConnected, socketOperations, setResults]);