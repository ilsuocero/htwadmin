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
}

function handleMapClick(e) {
    console.log('RV-->[handleMapClick]: editMode', editMode.current);
    // Only respond to clicks in edit mode
    if (!editMode.current) return;
    console.log('RV-->[handleMapClick]: e.lngLat.lng, e.lngLat.lat', e.lngLat.lng, e.lngLat.lat);

    // Step 7: Retrieve the clicked coordinates and add it as a new point feature
    const clickedPoint = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [e.lngLat.lng, e.lngLat.lat],
        },
        properties: {},
    };

    const tempPointSource = map.current.getSource('tempPointSource');
    const tempPointData = tempPointSource._data;
    tempPointData.features.push(clickedPoint);
    tempPointSource.setData(tempPointData);

    // Step 8: Update the line feature based on the new points
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
