import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import maplibregl from 'maplibre-gl';
import './map.css';
import CrossRoadForm from './CrossRoadForm';
import PathForm from './PathForm';
import ENV from '../ENV';
import { v4 as uuidv4 } from 'uuid';
import { OSRMService } from '../services/osrmService';

const Map = forwardRef(({
    pathNetwork,
    destNetwork,
    crossRoads,
    setCrossRoads,
    setPathNetwork,
    setDestNetwork,
    connectionState,
    socketOperations,
    isConnected,
    onAutoSegmentComplete
}, ref) => {
    console.log('🚀 Map-->[render]: Component rendering, ref:', ref);

    const [mapLoaded, setMapLoaded] = useState(false);
    const mapContainer = useRef(null);
    const [storedListeners, setStoredListeners] = useState(null);
    const map = useRef(null);
    const popup = useRef(null);
    const [lng] = useState(9.49709);
    const [lat] = useState(44.88096);
    const [zoom] = useState(14);
    const [showForm, setShowForm] = useState({ show: false, coordinates: null });
    const [pathForm, setPathForm] = useState({ show: false, coordinates: null, snap1: null, snap2: null });
    // Track the selected feature for dragging
    const selectedFeature = useRef(null); // this get the feature in mousedown
    const editMode = useRef(null); // this get the feature in mousedown
    const snapCrossRef = useRef(null); // snap feature
    const snap1 = useRef(null);
    const snap2 = useRef(null);

    const [editMODE, setEditMODE] = useState(false);
    const tempPointDataRef = useRef({ type: 'FeatureCollection', features: [] });

    // Auto-segment mode states
    const [autoSegmentMode, setAutoSegmentMode] = useState(false);
    const autoSegmentModeRef = useRef(false); // Ref for immediate access
    const [selectedCrossroads, setSelectedCrossroads] = useState([]);
    const [loadingOSRM, setLoadingOSRM] = useState(false);
    const [originalListeners, setOriginalListeners] = useState({});
    const escKeyListenerRef = useRef(null); // Ref to track ESC key listener

    // Expose the startAutoSegmentMode function to parent components
    useImperativeHandle(ref, () => {
        console.log('🚀 Map-->[useImperativeHandle]: Creating ref methods');
        return {
            startAutoSegmentMode: () => {
                console.log('🚀 Map-->[startAutoSegmentMode]: Called via ref');
                if (map.current) {
                    startAutoSegmentMode();
                }
            },
            stopAutoSegmentMode: () => {
                console.log('🚀 Map-->[stopAutoSegmentMode]: Called via ref');
                if (map.current) {
                    stopAutoSegmentMode();
                }
            }
        };
    });

    // Auto-segment mode functions
    const startAutoSegmentMode = () => {
        console.log('🚀 Map-->[startAutoSegmentMode]: Starting auto-segment mode');
        setAutoSegmentMode(true);
        autoSegmentModeRef.current = true; // Update ref for immediate access
        setSelectedCrossroads([]);
        map.current.getCanvas().style.cursor = 'crosshair';
        
        console.log('🚀 Map-->[startAutoSegmentMode]: Disabling existing event listeners');
        // Disable context menu and segment interactions
        map.current.off('contextmenu', handleContextMenu);
        map.current.off('click', 'sentieri');
        map.current.off('mousedown', 'destinazioni', handlePointsMouseDown)
        map.current.off('mousedown', 'incroci', handlePointsMouseDown)
        map.current.off('mouseenter', 'sentieri', mouseEnterSentieri);
        map.current.off('mouseleave', 'sentieri', mouseLeaveSentieri);
        
        // Disable hover effects for crossroads and destinations during auto-segment mode
        map.current.off('mouseenter', 'destinazioni');
        map.current.off('mouseleave', 'destinazioni');
        map.current.off('mouseenter', 'incroci');
        map.current.off('mouseleave', 'incroci');

        console.log('🚀 Map-->[startAutoSegmentMode]: Adding auto-segment click listeners');
        // Add click listener for destinazioni and incroci (treat as crossroads)
        map.current.on('click', 'destinazioni', handleCrossroadClick);
        map.current.on('click', 'incroci', handleCrossroadClick);
        
        // Update crossroad layer to show selection colors
        updateCrossroadSelectionColors();
        
        // Add ESC key listener for cancellation
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                console.log('🚀 Map-->[handleKeyDown]: ESC pressed, cancelling auto-segment mode');
                stopAutoSegmentMode();
            }
        };
        escKeyListenerRef.current = handleKeyDown;
        document.addEventListener('keydown', handleKeyDown);
        
        console.log('🚀 Map-->[startAutoSegmentMode]: Auto-segment mode started successfully');
    };

    const stopAutoSegmentMode = () => {
        console.log('🚀 Map-->[stopAutoSegmentMode]: Stopping auto-segment mode');
        setAutoSegmentMode(false);
        autoSegmentModeRef.current = false; // Update ref for immediate access
        setSelectedCrossroads([]);
        setLoadingOSRM(false);
        map.current.getCanvas().style.cursor = '';
        
        // Remove ESC key listener
        if (escKeyListenerRef.current) {
            console.log('🚀 Map-->[stopAutoSegmentMode]: Removing ESC key listener');
            document.removeEventListener('keydown', escKeyListenerRef.current);
            escKeyListenerRef.current = null;
        }
        
        // Re-enable context menu and segment interactions
        map.current.on('contextmenu', handleContextMenu);
        map.current.on('click', 'sentieri', function (e) {
            var coordinates = e.features[0].geometry.coordinates.slice();
            var description = e.features[0].properties.Nome;
            alert(description);
        });
        map.current.on('mousedown', 'destinazioni', handlePointsMouseDown)
        map.current.on('mousedown', 'incroci', handlePointsMouseDown)
        map.current.on('mouseenter', 'sentieri', mouseEnterSentieri);
        map.current.on('mouseleave', 'sentieri', mouseLeaveSentieri);
        
        // Re-enable hover effects for crossroads and destinations
        if (map.current.getLayer('destinazioni')) {
            map.current.on('mouseenter', 'destinazioni', function (e) {
                // Get the ID of the feature under the mouse cursor
                var featureId = e.features[0].properties.id;
                if (editMode.current) {
                    // Get the coordinates of the entered feature
        }
        
        // Remove any temporary layers
        if (map.current.getLayer('tempAutoSegmentLayer')) {
            map.current.removeLayer('tempAutoSegmentLayer');
        }
        if (map.current.getSource('tempAutoSegmentSource')) {
            map.current.removeSource('tempAutoSegmentSource');
        }
        
        // Notify parent component that auto-segment mode is complete
        if (onAutoSegmentComplete) {
            console.log('🚀 Map-->[stopAutoSegmentMode]: Notifying parent component');
            onAutoSegmentComplete();
        }
        
        console.log('🚀 Map-->[stopAutoSegmentMode]: Auto-segment mode stopped successfully');
    };

    // Update crossroad colors to show selected crossroads
    const updateCrossroadSelectionColors = () => {
        if (!map.current) return;
        
        const selectedIds = selectedCrossroads.map(crossroad => crossroad.properties.id);
        
        // Update incroci layer
        if (map.current.getLayer('incroci')) {
            map.current.setPaintProperty('incroci', 'circle-color', [
                'case',
                ['in', ['get', 'id'], ['literal', selectedIds]],
                ENV.CROSSROADS_SELECTED,
                ENV.CROSSROADS,
            ]);
        }
        
        // Update destinazioni layer (treat as crossroads)
        if (map.current.getLayer('destinazioni')) {
            map.current.setPaintProperty('destinazioni', 'circle-color', [
                'case',
                ['in', ['get', 'id'], ['literal', selectedIds]],
                ENV.CROSSROADS_SELECTED,
                ENV.DESTINATION,
            ]);
        }
    };

    const handleCrossroadClick = useCallback((e) => {
        console.log('🚀 Map-->[handleCrossroadClick]: Event triggered, autoSegmentModeRef:', autoSegmentModeRef.current);
        if (!autoSegmentModeRef.current) {
            console.log('🚀 Map-->[handleCrossroadClick]: Not in auto-segment mode, returning');
            return;
        }
        
        const feature = e.features[0];
        if (!feature) {
            console.log('🚀 Map-->[handleCrossroadClick]: No feature found');
            return;
        }
        
        console.log('🚀 Map-->[handleCrossroadClick]: Crossroad clicked:', feature.properties.id);
        
        // Use functional state update to get the latest selectedCrossroads
        setSelectedCrossroads(prevSelectedCrossroads => {
            console.log('🚀 Map-->[handleCrossroadClick]: Previous selected crossroads:', prevSelectedCrossroads.length);
            
            // Check if this crossroad is already selected
            const isAlreadySelected = prevSelectedCrossroads.some(
                selected => selected.properties.id === feature.properties.id
            );
            
            if (isAlreadySelected) {
                console.log('🚀 Map-->[handleCrossroadClick]: Crossroad already selected');
                return prevSelectedCrossroads; // Return unchanged state
            }
            
            // Add crossroad to selection
            const newSelectedCrossroads = [...prevSelectedCrossroads, feature];
            console.log('🚀 Map-->[handleCrossroadClick]: New selected crossroads:', newSelectedCrossroads.length);
            
            // If we have 2 crossroads selected, trigger OSRM routing
            if (newSelectedCrossroads.length === 2) {
                console.log('🚀 Map-->[handleCrossroadClick]: Two crossroads selected, triggering OSRM routing');
                generateAutoSegment(newSelectedCrossroads);
            }
            
            return newSelectedCrossroads;
        });
    }, []);

    // Automatically update crossroad colors when selectedCrossroads changes
    useEffect(() => {
        if (autoSegmentModeRef.current && selectedCrossroads.length > 0) {
            console.log('🚀 Map-->[useEffect selectedCrossroads]: Updating crossroad colors for', selectedCrossroads.length, 'selected crossroads');
            updateCrossroadSelectionColors();
        }
    }, [selectedCrossroads]);

    const generateAutoSegment = async (crossroads) => {
        if (crossroads.length !== 2) {
            console.error('🚀 Map-->[generateAutoSegment]: Need exactly 2 crossroads');
            return;
        }
        
        const [firstCrossroad, secondCrossroad] = crossroads;
        const startCoords = firstCrossroad.geometry.coordinates;
        const endCoords = secondCrossroad.geometry.coordinates;
        
        console.log('🚀 Map-->[generateAutoSegment]: Generating segment between', startCoords, 'and', endCoords);
        
        setLoadingOSRM(true);
        
        try {
            // Call OSRM service to get route
            const routeCoordinates = await OSRMService.getRoute(
                [startCoords[0], startCoords[1]],
                [endCoords[0], endCoords[1]]
            );
            
            console.log('🚀 Map-->[generateAutoSegment]: Route generated with', routeCoordinates.length, 'points');
            
            // Create temporary layer to show the route
            if (map.current.getSource('tempAutoSegmentSource')) {
                map.current.removeSource('tempAutoSegmentSource');
            }
            
            map.current.addSource('tempAutoSegmentSource', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: routeCoordinates
                    },
                    properties: {}
                }
            });
            
            if (map.current.getLayer('tempAutoSegmentLayer')) {
                map.current.removeLayer('tempAutoSegmentLayer');
            }
            
            map.current.addLayer({
                id: 'tempAutoSegmentLayer',
                type: 'line',
                source: 'tempAutoSegmentSource',
                paint: {
                    'line-color': '#00ff00',
                    'line-width': 3,
                    'line-opacity': 0.7
                }
            });
            
            // Open PathForm with the generated coordinates
            setPathForm({
                show: true,
                coordinates: routeCoordinates,
                snap1: { 
                    clickedCoords: startCoords, 
                    featureId: firstCrossroad.properties.id 
                },
                snap2: { 
                    clickedCoords: endCoords, 
                    featureId: secondCrossroad.properties.id 
                }
            });
            
            // Stop auto-segment mode
            stopAutoSegmentMode();
            
        } catch (error) {
            console.error('🚀 Map-->[generateAutoSegment]: Error generating route:', error);
            alert(`Failed to generate route: ${error.message}`);
            stopAutoSegmentMode();
        } finally {
            setLoadingOSRM(false);
        }
    };


    useEffect(() => {
        if (!editMode.current) editMode.current = false;

        if (!map.current && !mapLoaded) {
            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style:
                    'https://api.maptiler.com/maps/31a213b1-dcd5-49da-a9f2-30221bd06829/style.json?key=5pbRWTv0ewzGTsPxx4me',
                center: [lng, lat],
                zoom: zoom,
            });

            map.current.on('load', () => {
                let mousedownEvent = null; // Variable to store the mousedown event object
                setMapLoaded(true);
                setEditMODE(false);
                editMode.current = false;
            });
        }

        return () => {
            map.current = null;
        };
    }, []);

    const handleContextMenu = useCallback((e) => {
        // Prevent the default context menu
        e.preventDefault();
        // Get the clicked coordinates
        var coordinates = e.lngLat;
        // Handle the right-click event
        // Create and position the custom context menu
        showContextMenu(coordinates);
    }, []);



    // Edit Mode
    useEffect(() => {
        if (!editMODE) {
            map.current.on('contextmenu', handleContextMenu);
            snap1.current = null
            snap2.current = null
        }

        if (editMODE) {
            map.current.off('contextmenu', handleContextMenu);

        }
        return () => {
            // Clean up event listeners when the component unmounts
            map.current.off('contextmenu', handleContextMenu);
        };

    }, [editMODE]);





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

    function newSegment() {
        // Step 1: Enable edit mode to allow adding and dragging points
        editMode.current = true;
        setEditMODE(true);
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
                'circle-radius': 4,
                'circle-color': 'blue',
            },
        });

        // Step 6: Add a click event listener to capture new points
        map.current.on('click', handleMapClick);

        // Step 7: Add event listener for "Cancel" key press

    }

    function handleMapClick(e) {
        console.log('RV-->[handleMapClick]: editMode', editMode.current);
        // Only respond to clicks in edit mode
        if (!editMode.current) return;
        if (snap1.current && snap2.current) {
            alert('You already concluded the segment. '
                + '\n Save it or Quit. '
                + '\n To continue to edit, cancel one or some sub-segment.');
            return;
        }
        console.log('RV-->[handleMapClick]: e.lngLat.lng, e.lngLat.lat', e.lngLat.lng, e.lngLat.lat);

        // Step 8: Retrieve the clicked coordinates and add them as a new point feature
        let clickedCoords = [e.lngLat.lng, e.lngLat.lat];

        // Check if a feature was clicked   
        if (snapCrossRef.current) {
            const { clickedCoordinates, featureId } = snapCrossRef.current;
            console.log('RV-->[handleMapClick]: featureId clickedCoordinates, snap1', featureId, clickedCoordinates, snap1);
            clickedCoords = clickedCoordinates;
            // Store the snap coordinates in state
            if (!snap1.current) {
                console.log('RV-->[handleMapClick]: FIRST SNAP')
                snap1.current = { clickedCoords, featureId }
            } else {
                console.log('RV-->[handleMapClick]: SECOND SNAP')
                snap2.current = { clickedCoords, featureId }
            }
        } else {
            //The segment must start and end from a destination or a crossroad
            if (!snap1.current) {
                alert('You must start from a destination or a crossroad. '
                    + '\n Warning: before creating the segment check if both '
                    + '\n endpoints ( )<-segment->( ) are in place.');
                return;
            }
        }

        const clickedPoint = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: clickedCoords,
            },
            properties: {},
        };

        const tempPointSource = map.current.getSource('tempPointSource');
        const tempPointData = tempPointSource._data;
        tempPointDataRef.current = tempPointData;
        tempPointData.features.push(clickedPoint);
        tempPointSource.setData(tempPointData);

        // Step 9: Update the line feature based on the new points
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


    useEffect(() => {

        // Attach keydown event listener to the document only in edit mode

        const handleKeyDown = (e) => {
            console.log('RV-->[handleKeyDown]: e.keyCode', e.keyCode);

            // Check if the "Cancel" key is pressed (Escape key)

            if (editMode.current) {
                if (e.keyCode === 46) {
                    // Call the cancelSegment function
                    cancelSegment();
                }
                // Check if the "Save" key is pressed (e.g., 's' key)
                if (e.keyCode === 83) { // s letter
                    // Call the saveSegment function
                    saveSegment();
                }
                // Check if the "Quit" key is pressed (e.g., 'q'' key)
                if (e.keyCode === 81) { // q letter
                    // Call the saveSegment function
                    quitSegment();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Clean up the event listener on component unmount
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };

    }, []);

    function quitSegment() {
        const closePopup = () => {
            if (mapContainer.current && popup.parentNode === mapContainer.current) {
                mapContainer.current.removeChild(popup);
            }
        }
        const handleConfirmation = () => {
            // Step 4: Remove the temporary line and point layers
            map.current.removeLayer('tempLineLayer');
            map.current.removeLayer('tempPointLayer');
            map.current.removeSource('tempLineSource');
            map.current.removeSource('tempPointSource');

            // Step 5: Disable edit mode
            editMode.current = false;
            setEditMODE(false)
            map.current.getCanvas().style.cursor = '';
            map.current.off('mousemove', dragFeature);
            closePopup();
        }
        const popup = document.createElement('div');
        popup.className = 'map-popup';
        popup.style.background = 'white'; // Set the background color
        popup.style.padding = '8px'; // Add padding
        popup.style.borderRadius = '4px'; // Add border radius
        popup.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'; // Add box shadow
        popup.style.fontFamily = 'Arial, sans-serif'; // Set font family
        popup.style.fontSize = '14px'; // Set font size

        const message = document.createElement('p');
        message.textContent = 'Are you sure?';

        const yesButton = document.createElement('button');
        yesButton.textContent = 'Yes';
        yesButton.addEventListener('click', handleConfirmation);

        const noButton = document.createElement('button');
        noButton.textContent = 'No';
        noButton.addEventListener('click', closePopup);

        popup.appendChild(message);
        popup.appendChild(yesButton);
        popup.appendChild(noButton);

        // Position the popup at the center of the map
        //const mapContainer = map.current.getContainer();
        const mapWidth = mapContainer.current.offsetWidth;
        const mapHeight = mapContainer.current.offsetHeight;
        //const centerLngLat = map.continer.unproject([mapWidth / 2, mapHeight / 2]);

        // Set the popup's position
        popup.style.position = 'absolute';
        popup.style.left = `${mapWidth / 2}px`;
        popup.style.top = `${mapHeight / 2}px`;


        // Add the popup to the map container

        mapContainer.current.appendChild(popup);
    }

    function saveSegment() {
        if (!snap2.current) {
            alert('A segment must start/end from a crossroad or a destination!')
            return;
        }
        // Get the coordinates of the segment and add it to the sentieri feature collection
        const tempLineSource = map.current.getSource('tempLineSource');
        const tempLineData = tempLineSource._data;

        if (tempLineData.geometry && tempLineData.geometry.coordinates.length > 0) {
            const coordinates = tempLineData.geometry.coordinates;
            setPathForm({ show: true, coordinates: coordinates, 
                snap1: snap1.current, snap2: snap2.current}); // Pass the coordinates to the hook

            // Get the 'sentieri' source 
            // const sentieriSource = map.current.getSource('sentieri');
            // const sentieriData = sentieriSource._data;

            /*             const newSegment = {
                            type: 'Feature',
                            geometry: {
                                type: 'LineString',
                                coordinates: segmentCoordinates,
                            },
                            properties: {
                                id: uuidv4()
                            },
                        };
                        setPathNetwork((prevPathNetwork) => ({
                            ...prevPathNetwork,
                            features: [...prevPathNetwork.features, newSegment]
                        })); */

            // sentieriData.features.push(newSegment);
            // sentieriSource.setData(sentieriData);
            //Not necessary, the hook is managing the setData
            //map.current.getSource('sentieri').setData(pathNetwork);
        }
        // Step 4: Remove the temporary line and point layers
        /*         map.current.removeLayer('tempLineLayer');
                map.current.removeLayer('tempPointLayer');
                map.current.removeSource('tempLineSource');
                map.current.removeSource('tempPointSource');
        
                // Step 5: Disable edit mode
                editMode.current = false;
                setEditMODE(false)
                map.current.getCanvas().style.cursor = ''; */
    }


    function cancelSegment() {
        const tempPointData = tempPointDataRef.current;
        if (tempPointData.features.length > 0) {
            // Remove the last point
            tempPointData.features.pop();

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

            const tempPointSource = map.current.getSource('tempPointSource');
            tempPointSource.setData(tempPointData);
            snap2.current = null; //anyway it won't be stapped to the final dest
        }
    }

    useEffect(() => {
        if (mapLoaded && pathNetwork != null) {
            //console.log('RV-->[map]: pathNetwork:', JSON.stringify(pathNetwork));

            if (!map.current.getSource('sentieri')) {
                map.current.addSource('sentieri', {
                    type: 'geojson',
                    data: pathNetwork,
                });

                map.current.addLayer({
                    id: 'sentieri',
                    type: 'line',
                    source: 'sentieri',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round',
                    },
                    paint: {
                        'line-color': '#ff000080',
                        'line-dasharray': [2, 1.5],
                        'line-width': 4,
                    },
                });

                map.current.on('click', 'sentieri', function (e) {
                    var coordinates = e.features[0].geometry.coordinates.slice();
                    var description = e.features[0].properties.Nome;
                    alert(description);
                });

                map.current.on('mouseenter', 'sentieri', mouseEnterSentieri);

                map.current.on('mouseleave', 'sentieri', mouseLeaveSentieri);
            } else {
                // Update the source data if it already exists
                map.current.getSource('sentieri').setData(pathNetwork);
            }
        }
    }, [mapLoaded, pathNetwork]);

    const mouseEnterSentieri = useCallback((e) => {
        // Get the ID of the feature under the mouse cursor
        var featureId = e.features[0].properties.id;

        // Update the color of the specific feature
        map.current.setPaintProperty('sentieri', 'line-color', [
            'case',
            ['==', ['get', 'id'], featureId],
            ENV.PATH_OVER, // New color for the specific feature
            ENV.PATH, // Default color for other features
        ]);

        map.current.getCanvas().style.cursor = 'pointer';
    }, []);

    const mouseLeaveSentieri = useCallback((e) => {
        // Reset the line color on mouseleave
        map.current.setPaintProperty('sentieri', 'line-color', ENV.PATH);
        map.current.getCanvas().style.cursor = '';
    }, []);

    useEffect(() => {
        if (mapLoaded && destNetwork != null) {
            //console.log('RV-->[map]: destNetwork:', JSON.stringify(destNetwork));
            if (!map.current.getSource('destinazioni')) {

                map.current.addSource('destinazioni', {
                    type: 'geojson',
                    data: destNetwork,
                });

                map.current.addLayer({
                    id: 'destinazioni',
                    type: 'circle',
                    source: 'destinazioni',
                    paint: {
                        'circle-radius': 10,
                        'circle-color': ENV.DESTINATION,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': 'black',
                        'circle-pitch-scale': 'viewport',
                    },
                    filter: ['==', '$type', 'Point'],
                    draggable: true, // Set the draggable property to true
                });

                map.current.on('mouseenter', 'destinazioni', function (e) {
                    // Get the ID of the feature under the mouse cursor
                    var featureId = e.features[0].properties.id;
                    if (editMode.current) {
                        // Get the coordinates of the entered feature
                        console.log('RV-->[map]: mouseenter e.features[0]:', e.features[0].geometry.coordinates);
                        const clickedCoordinates = e.features[0].geometry.coordinates;
                        snapCrossRef.current = { clickedCoordinates, featureId };
                    }

                    // Update the color of the specific feature
                    map.current.setPaintProperty('destinazioni', 'circle-color', [
                        'case',
                        ['==', ['get', 'id'], featureId],
                        ENV.DESTINATION_OVER, // New color for the specific feature
                        ENV.DESTINATION, // Default color for other features
                    ]);

                    // Change the cursor style as a UI indicator.
                    map.current.getCanvas().style.cursor = 'pointer';
                });

                map.current.on('mouseleave', 'destinazioni', function () {
                    snapCrossRef.current = null;
                    map.current.setPaintProperty('destinazioni', 'circle-color', ENV.DESTINATION);
                    map.current.getCanvas().style.cursor = '';
                });

                map.current.on('mousedown', 'destinazioni', handlePointsMouseDown)
            } else {
                // Update the source data if it already exists
                map.current.getSource('destinazioni').setData(destNetwork);
            }
        }
    }, [mapLoaded, destNetwork]);

    useEffect(() => {
        if (mapLoaded && crossRoads != null) {
            //console.log('RV-->[map]: destNetwork:', JSON.stringify(destNetwork));
            if (!map.current.getSource('incroci')) {
                // Add the source if it doesn't exist
                map.current.addSource('incroci', {
                    type: 'geojson',
                    data: crossRoads,
                });

                map.current.addLayer({
                    id: 'incroci',
                    type: 'circle',
                    source: 'incroci',
                    paint: {
                        'circle-radius': 7,
                        'circle-color': ENV.CROSSROADS,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': 'black',
                        'circle-pitch-scale': 'viewport',
                    },
                    filter: ['==', '$type', 'Point'],
                    draggable: true, // Set the draggable property to true
                });

                map.current.on('mouseenter', 'incroci', function (e) {
                    // Get the ID of the feature under the mouse cursor
                    var featureId = e.features[0].properties.id;
                    if (editMode.current) {
                        // Get the coordinates of the entered feature
                        const clickedCoordinates = e.features[0].geometry.coordinates;
                        snapCrossRef.current = { clickedCoordinates, featureId };
                    }

                    // Update the color of the specific feature
                    map.current.setPaintProperty('incroci', 'circle-color', [
                        'case',
                        ['==', ['get', 'id'], featureId],
                        ENV.CROSSROADS_OVER, // New color for the specific feature
                        ENV.CROSSROADS, // Default color for other features
                    ]);
                    // Change the cursor style as a UI indicator.
                    map.current.getCanvas().style.cursor = 'pointer';
                });

                map.current.on('mouseleave', 'incroci', function () {
                    snapCrossRef.current = null;
                    map.current.setPaintProperty('incroci', 'circle-color', ENV.CROSSROADS);
                    map.current.getCanvas().style.cursor = '';
                });

                map.current.on('mousedown', 'incroci', handlePointsMouseDown);

            } else {
                // Update the source data if it already exists
                map.current.getSource('incroci').setData(crossRoads);
            }
        }
    }, [mapLoaded, crossRoads]);

    const handlePointsMouseDown = useCallback((e) => {
        if (editMode.current) return;
        if (autoSegmentMode) return; // Skip if in auto-segment mode
        if (!e) return
        if (!editMode.current) {
            console.log('RV-->[map]: handlePointsMouseDown, editMode.current:', editMode.current);
            e.preventDefault();
            selectedFeature.current = e.features[0];
            map.current.on('mousemove', dragFeature);
            map.current.once('mouseup', stopDragging);
        }

    }, [autoSegmentMode]);

    const dragFeature = useCallback((e) => {
        if (selectedFeature.current && e.originalEvent.buttons === 1) {
            map.current.getCanvas().style.cursor = 'grab';
            var coords = e.lngLat;
            const newCoordinates = [coords.lng, coords.lat];
            //update coord for update
            selectedFeature.current.geometry.updateCoords = newCoordinates;
            // Update the feature's coordinates
            const sourceId = selectedFeature.current.source;
            const featureId = selectedFeature.current.properties.id;
            const source = map.current.getSource(sourceId);
            const featureCollection = source._data;
            const updatedFeatures = featureCollection.features.map((feature) => {
                if (feature.properties.id === featureId) {
                    return {
                        ...feature,
                        geometry: {
                            ...feature.geometry,
                            coordinates: newCoordinates,
                        },
                    };
                }
                return feature;
            });
            const updatedFeatureCollection = {
                ...featureCollection,
                features: updatedFeatures,
            };
            // Update the source data with the updated feature collection
            source.setData(updatedFeatureCollection);
        }
    }, []);

    const stopDragging = useCallback(() => {
        if (editMode.current) return;
        if (selectedFeature.current) {
            // Stop dragging by resetting the selected feature
            console.log('RV-->[stopDragging]: selectedFeature.current', selectedFeature.current);
            const featureCoordinates = selectedFeature.current.geometry.coordinates;
            setShowForm({ show: true, coordinates: { lng: featureCoordinates[0], lat: featureCoordinates[1] } });

        }
        // selectedFeature.current = null; <=== this is made on the crossRoadForm
        // // Unbind mouse/touch events
        if (!selectedFeature.current) map.current.off('mousemove', dragFeature);
    }, [selectedFeature.current]);


    // Handler for crossroad form submission
    const handleCrossRoadSubmit = (newFeature) => {
        if (['destinazione', 'POIdest'].includes(newFeature.properties.Tipo)) {
            setDestNetwork((prevDestNetwork) => ({
                ...prevDestNetwork,
                features: [...prevDestNetwork.features, newFeature]
            }));
        } else {
            setCrossRoads((prevCrossRoads) => ({
                ...prevCrossRoads,
                features: [...prevCrossRoads.features, newFeature]
            }));
        }
        selectedFeature.current = null;
    };

    // Handler for path form submission
    const handlePathSubmit = (newSegment) => {
        setPathNetwork(prevPathNetwork => ({
            ...prevPathNetwork,
            features: [...prevPathNetwork.features, newSegment]
        }));
        selectedFeature.current = null;
        
        // Reset edit mode after segment is saved
        editMode.current = false;
        setEditMODE(false);
        map.current.getCanvas().style.cursor = '';
        map.current.off('click', handleMapClick);
        
        // Remove temporary layers and sources
        if (map.current.getLayer('tempLineLayer')) {
            map.current.removeLayer('tempLineLayer');
        }
        if (map.current.getLayer('tempPointLayer')) {
            map.current.removeLayer('tempPointLayer');
        }
        if (map.current.getSource('tempLineSource')) {
            map.current.removeSource('tempLineSource');
        }
        if (map.current.getSource('tempPointSource')) {
            map.current.removeSource('tempPointSource');
        }
        
        // Reset snap points
        snap1.current = null;
        snap2.current = null;
        snapCrossRef.current = null;
    };

    return (
        <div className="map-wrap">
            <div ref={mapContainer} className="map" />
            
            {/* React Form Components */}
            <CrossRoadForm
                open={showForm.show}
                onClose={() => setShowForm({ show: false, coordinates: null })}
                onSubmit={handleCrossRoadSubmit}
                coordinates={showForm.coordinates || { lng: 0, lat: 0 }}
                connectionState={connectionState}
                selectedFeature={selectedFeature}
                socketOperations={socketOperations}
                isConnected={isConnected}
            />
            
            <PathForm
                open={pathForm.show}
                onClose={() => setPathForm({ show: false, coordinates: null, snap1: null, snap2: null })}
                onSubmit={handlePathSubmit}
                coordinates={pathForm.coordinates || []}
                connectionState={connectionState}
                snap1={pathForm.snap1}
                snap2={pathForm.snap2}
                selectedFeature={selectedFeature}
                socketOperations={socketOperations}
                isConnected={isConnected}
            />
        </div>
    );
});

export default Map;
