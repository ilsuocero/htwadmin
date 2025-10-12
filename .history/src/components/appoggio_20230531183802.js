function newSegment() {
    // Step 1: Enable edit mode to allow adding and dragging points
    editMode.current = true;
    map.current.getCanvas().style.cursor = 'crosshair';

    // Step 2: Create a new temporary source for the line layer
    map.current.addSource('tempLineSource', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: [],
        },
    });

    // Step 3: Create a new temporary source for the points
    map.current.addSource('tempPointSource', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: [],
        },
    });

    // Step 4: Add a layer for the line segment using the temporary line source
    map.current.addLayer({
        id: 'tempLineLayer',
        type: 'line',
        source: 'tempLineSource',
        paint: {
            'line-color': 'red',
            'line-width': 2,
        },
    });

    // Step 5: Add a layer for the points using the temporary point source
    map.current.addLayer({
        id: 'tempPointLayer',
        type: 'circle',
        source: 'tempPointSource',
        paint: {
            'circle-radius': 5,
            'circle-color': 'blue',
        },
    });

    // Step 6: Add a click event listener to capture new points
    map.current.on('click', handleMapClick);

    // Step 7: Add event listener for "Cancel" key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check if the "Cancel" key is pressed (Escape key)
            if (e.keyCode === 27) {
                // Call the cancelSegmentPoint function
                cancelSegmentPoint();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Clean up the event listener on component unmount
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Rest of the code...
}

function handleMapClick(e) {
    // Rest of the code...
}

function cancelSegmentPoint() {
    const tempPointSource = map.current.getSource('tempPointSource');
    const tempPointData = { ...tempPointSource._data }; // Make a copy of the data

    if (tempPointData.features.length > 0) {
        tempPointData.features.pop();
        tempPointSource.setData(tempPointData);

        // Update the line feature based on the remaining points
        const lineStringFeature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: tempPointData.features.map((point) => point.geometry.coordinates),
            },
            properties: {},
        };

        const tempLineSource = map.current.getSource('tempLineSource');
        tempLineSource.setData(lineStringFeature);
    }
}
