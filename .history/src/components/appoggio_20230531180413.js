import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

function MapComponent() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [editMode, setEditMode] = useState(false);
    const tempPointDataRef = useRef({ type: 'FeatureCollection', features: [] });

    useEffect(() => {
        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style:
                'https://api.maptiler.com/maps/31a213b1-dcd5-49da-a9f2-30221bd06829/style.json?key=5pbRWTv0ewzGTsPxx4me',
            center: [lng, lat],
            zoom: zoom,
        });

        return () => {
            map.current.remove();
        };
    }, []);

    function newSegment() {
        // Step 1: Enable edit mode to allow adding and dragging points
        setEditMode(true);
        map.current.getCanvas().style.cursor = 'crosshair';

        // Rest of the code...
    }

    function handleMapClick(e) {
        // Only respond to clicks in edit mode
        if (!editMode) return;

        // Check if the "Cancel" key is pressed
        if (e.originalEvent.keyCode === 27) {
            // Remove the last added point from tempPointData
            const tempPointData = tempPointDataRef.current;
            if (tempPointData.features.length > 0) {
                tempPointData.features.pop();
                const tempPointSource = map.current.getSource('tempPointSource');
                tempPointSource.setData(tempPointData);
            }
        } else {
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
    }

    useEffect(() => {
        // Attach keydown event listener to the document only in edit mode
        if (editMode) {
            const handleKeyDown = (e) => {
                // Check if the "Cancel" key is pressed (Escape key)
                if (e.keyCode === 27) {
                    // Call the cancelSegment function
                    cancelSegment();
                }
            };

            document.addEventListener('keydown', handleKeyDown);

            // Clean up the event listener on component unmount
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [editMode]);

    function cancelSegment() {
        // Remove the last added point from tempPointData
        const tempPointData = tempPointDataRef.current;
        if (tempPointData.features.length > 0) {
            tempPointData.features.pop();
            const tempPointSource = map.current.getSource('tempPointSource');
            tempPointSource.setData(tempPointData);
        }
    }

    return (
        <div>
            <button onClick={newSegment}>New Segment</button>
            <div ref={mapContainer} style={{ width: '100%', height: '100vh' }}>
                {/* Map container element */}
            </div>
        </div>
    );
}

export default MapComponent;
