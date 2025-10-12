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

const showContextMenu = (coordinates) => {

    // Create a custom context menu element
    const contextMenu = document.createElement('div');
    contextMenu.className = 'custom-context-menu';
    contextMenu.style.background = 'white'; // Set the background color
    contextMenu.style.padding = '8px'; // Add padding
    contextMenu.style.borderRadius = '4px'; // Add border radius
    contextMenu.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'; // Add box shadow
    contextMenu.style.fontFamily = 'Arial, sans-serif'; // Set font family
    contextMenu.style.fontSize = '14px'; // Set font size

    // Create menu entries
    const entry1 = document.createElement('div');
    entry1.className = 'menu-entry';
    entry1.innerHTML = 'New Crossroad';
    entry1.style.marginBottom = '4px'; // Add spacing between entries

    const entry2 = document.createElement('div');
    entry2.className = 'menu-entry';
    entry2.innerHTML = 'New Segment';

    // Append menu entries to the context menu
    contextMenu.appendChild(entry1);
    contextMenu.appendChild(entry2);

    // Position the context menu near the clicked coordinates
    const offsetX = 10; // Adjust the X offset as needed
    const offsetY = -10; // Adjust the Y offset as needed
    const pos = map.current.project(coordinates).add(new maplibregl.Point(offsetX, offsetY));
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = pos.x + 'px';
    contextMenu.style.top = pos.y + 'px';


    // Append the context menu to the map container
    mapContainer.current.appendChild(contextMenu);

    // Handle click events on the context menu entries
    entry1.addEventListener('click', (e) => {
        // Open the custom dialog to input crossroad properties
        setShowForm({ show: true, coordinates }); // Pass the coordinates to the hook
        removeContextMenu();
    });

    entry2.addEventListener('click', (e) => {
        // Handle the click event on "New Segment"
        //alert('Clicked on "New Segment"');
        newSegment();
        removeContextMenu();
    });

    // Remove the context menu when pressing the Esc key
    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            removeContextMenu();
        }
    };

    // Remove the context menu when clicking outside
    const handleClickOutside = (event) => {
        if (!contextMenu.contains(event.target)) {
            removeContextMenu();
        }
    };

    // Add event listeners to cancel the context menu
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);

    // Function to remove the context menu
    const removeContextMenu = () => {
        if (mapContainer.current && contextMenu.parentNode === mapContainer.current) {
            mapContainer.current.removeChild(contextMenu);
        }
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('click', handleClickOutside);
    };
};
