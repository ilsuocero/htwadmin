import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';
import ENV from '../ENV';

export const useEditModeManager = (getMap) => {
    const { state, dispatch } = useAppState();

    // Father state - manages ALL edit mode state AND ALL event handlers
    const [currentMode, setCurrentMode] = useState('NORMAL');
    const [publicCurrentMode, setPublicCurrentMode] = useState('NORMAL');

    // Hover handlers for sentieri (paths) in NORMAL mode - defined BEFORE setup functions to fix hoisting
    const mouseEnterSentieri = useCallback((e) => {
        console.log('🎯 EDIT MODE MANAGER: Mouse enter sentieri');
        const map = getMap();
        if (!map) return;

        // Get the ID of the feature under the mouse cursor
        const featureId = e.features[0].properties.id;

        // Update the color of the specific feature
        map.setPaintProperty('sentieri', 'line-color', [
            'case',
            ['==', ['get', 'id'], featureId],
            ENV.PATH_OVER, // New color for the specific feature
            ENV.PATH, // Default color for other features
        ]);

        map.getCanvas().style.cursor = 'pointer';
    }, []);

    const mouseLeaveSentieri = useCallback(() => {
        console.log('🎯 EDIT MODE MANAGER: Mouse leave sentieri');
        const map = getMap();
        if (!map) return;

        // Reset the line color on mouseleave
        map.setPaintProperty('sentieri', 'line-color', ENV.PATH);
        map.getCanvas().style.cursor = '';
    }, []);

    // Core edit mode functions defined before event handlers to fix hoisting
    // Note: updateTemporarySources removed - using direct approach like backup

    const handleEditModeClick = useCallback((e) => {
        console.log('🎯 EDIT MODE MANAGER: Edit mode click at:', e.lngLat);
        console.log('🎯 EDIT MODE MANAGER: snapCrossRef.current:', snapCrossRef.current);
        console.log('🎯 EDIT MODE MANAGER: snap1.current:', snap1.current);
        console.log('🎯 EDIT MODE MANAGER: snap2.current:', snap2.current);

        const map = getMap();
        if (!map) return;

        // Check if segment is already completed (like backup)
        if (snap1.current && snap2.current) {
            alert('You already concluded the segment. \n Save it or Quit. \n To continue to edit, cancel one or some sub-segment.');
            return;
        }

        let clickedCoords = [e.lngLat.lng, e.lngLat.lat];

        // Check if we're hovering over a feature (like backup implementation)
        if (snapCrossRef.current) {
            const { clickedCoordinates, featureId } = snapCrossRef.current;
            console.log('🎯 EDIT MODE MANAGER: Snapping to feature:', featureId, clickedCoordinates);
            clickedCoords = clickedCoordinates;

            // Store the snap coordinates in local refs (like backup)
            if (!snap1.current) {
                console.log('🎯 EDIT MODE MANAGER: FIRST SNAP');
                snap1.current = { clickedCoords, featureId };
            } else {
                console.log('🎯 EDIT MODE MANAGER: SECOND SNAP');
                snap2.current = { clickedCoords, featureId };
            }
        } else {
            // If we get here, we clicked on empty map (no features)
            if (!snap1.current) {
                // First click must be on a crossroad/destination (like backup)
                alert('You must start from a destination or a crossroad. \nWarning: before creating the segment check if both \nendpoints ( )<-segment->( ) are in place.');
                return;
            }
        }

        // Add the point to our temporary points (both snapped and intermediate points)
        const clickedPoint = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: clickedCoords,
            },
            properties: {},
        };

        tempPointsRef.current.push(clickedPoint);

        // Update temporary sources (like backup)
        const tempPointSource = map.getSource('tempPointSource');
        const tempPointData = tempPointSource._data;
        tempPointData.features.push(clickedPoint);
        tempPointSource.setData(tempPointData);

        // Update the line feature based on the new points (like backup)
        const lineStringFeature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: tempPointData.features.map((point) => point.geometry.coordinates),
            },
            properties: {},
        };

        const tempLineSource = map.getSource('tempLineSource');
        tempLineSource.setData(lineStringFeature);

        // Show completion popup when both endpoints are snapped (like backup)
        if (snap1.current && snap2.current) {
            setTimeout(() => {
                const confirmed = window.confirm('Segment completed!\n\nClick "Save" to save the segment or "Continue" to keep editing.');
                if (confirmed) {
                    // User clicked Save - show the PathForm
                    dispatch({
                        type: 'SHOW_PATH_FORM',
                        payload: {
                            coordinates: tempPointData.features.map(point => point.geometry.coordinates),
                            snap1: snap1.current,
                            snap2: snap2.current
                        }
                    });
                } else {
                    // User clicked Continue - stay in edit mode
                    console.log('User chose to continue editing');
                }
            }, 100);
        }

    }, [dispatch]);

    // All event handlers defined after core functions to fix hoisting issues
    const handleMapClick = useCallback((e) => {
        console.log('🎯 EDIT MODE MANAGER: Map clicked in mode:', publicCurrentMode);

        switch (publicCurrentMode) {
            case 'EDIT':
                handleEditModeClick(e);
                break;
            default:
                console.log('🎯 EDIT MODE MANAGER: No action for mode:', publicCurrentMode);
                break;
        }
    }, [publicCurrentMode, handleEditModeClick]);

    const handleContextMenu = useCallback((e) => {
        console.log('🎯 EDIT MODE MANAGER: Context menu triggered in mode:', publicCurrentMode);
        console.log('🎯 EDIT MODE MANAGER: Context menu event details:', {
            point: e.point,
            lngLat: e.lngLat,
            features: e.features?.length || 0
        });

        if (publicCurrentMode === 'NORMAL') {
            e.preventDefault();
            console.log('🎯 EDIT MODE MANAGER: Dispatching SHOW_CONTEXT_MENU with payload:', {
                position: { x: e.point.x, y: e.point.y },
                coordinates: e.lngLat
            });
            dispatch({
                type: 'SHOW_CONTEXT_MENU',
                payload: {
                    position: { x: e.point.x, y: e.point.y },
                    coordinates: e.lngLat
                }
            });
        } else {
            console.log('🎯 EDIT MODE MANAGER: Context menu ignored - not in NORMAL mode');
        }
    }, [publicCurrentMode, dispatch]);

    // Simple handlers for other events (can be enhanced as needed)
    const handleMapMouseDown = useCallback(() => { }, []);
    const handleMapMouseMove = useCallback(() => { }, []);
    const handleMapMouseUp = useCallback(() => { }, []);

    // All edit mode state management here - use local refs like backup
    const isFirstClickRef = useRef(true);
    const tempPointsRef = useRef([]);
    const snapCrossRef = useRef(null); // snap feature reference (like backup)
    const snap1 = useRef(null); // first snap point (like backup)
    const snap2 = useRef(null); // second snap point (like backup)

    // Event handler refs - father state manages ALL event handlers
    const eventHandlersRef = useRef({
        click: null,
        contextmenu: null,
        mousedown: null,
        mousemove: null,
        mouseup: null,
        mouseenter: {},
        mouseleave: {}
    });

    // Father state manages ALL event handlers
    const clearAllEventHandlers = useCallback(() => {
        console.log('🚀 EDIT MODE MANAGER: Clearing ALL event handlers');
        const map = getMap();
        if (!map) return;

        try {
            // Clear general listeners
            map.off('click');
            map.off('contextmenu');
            map.off('mousedown');
            map.off('mousemove');
            map.off('mouseup');

            // Clear layer-specific listeners
            ['sentieri', 'destinazioni', 'incroci'].forEach(layerId => {
                if (map.getLayer(layerId)) {
                    map.off('click', layerId);
                    map.off('mousedown', layerId);
                    map.off('mouseenter', layerId);
                    map.off('mouseleave', layerId);
                }
            });

            // Reset event handlers ref
            eventHandlersRef.current = {
                click: null,
                contextmenu: null,
                mousedown: null,
                mousemove: null,
                mouseup: null,
                mouseenter: {},
                mouseleave: {},
                sentieriClickHandler: null
            };
            console.log('🚀 EDIT MODE MANAGER: All event handlers cleared successfully');
        } catch (error) {
            console.warn('🛑 EDIT MODE MANAGER: Error clearing event handlers:', error);
        }
    }, [getMap]);

    // Setup event handlers based on mode - father state manages ALL events
    const setupEventHandlers = useCallback((mode, handlers = {}) => {
        console.log('🎯 EDIT MODE MANAGER: Setting up event handlers for mode:', mode);
        const map = getMap();
        if (!map) return;

        // Clear existing handlers first
        clearAllEventHandlers();

        try {
            // Set up handlers based on mode
            switch (mode) {
                case 'NORMAL':
                    setupNormalModeHandlers(map, handlers);
                    break;
                case 'EDIT':
                    setupEditModeHandlers(map, handlers);
                    break;
                case 'AUTO_SEGMENT':
                    setupAutoSegmentHandlers(map, handlers);
                    break;
                default:
                    setupNormalModeHandlers(map, handlers);
            }
        } catch (error) {
            console.error('EDIT MODE MANAGER: Error setting up event handlers:', error);
        }
    }, [getMap, clearAllEventHandlers]);


    // Track if we've already set up event handlers to prevent infinite loops
    const handlersSetupRef = useRef(false);

    // Sync with global state
    useEffect(() => {
        console.log('🔍 EDIT MODE MANAGER: Global state mode changed to:', state.map.mode);
        setCurrentMode(state.map.mode);
    }, [state.map.mode]);

    // When mode changes, update both states and setup event handlers
    useEffect(() => {
        console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Mode changed -', currentMode);
        setPublicCurrentMode(currentMode);

        const map = getMap();
        if (!map) return;

        // Force re-setup of event handlers when mode changes
        // This ensures hover handlers are properly set up
        console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Setting up event handlers for mode:', currentMode);

        // Set up event handlers for the current mode with all necessary handlers
        setupEventHandlers(currentMode, {
            click: handleMapClick,
            contextmenu: handleContextMenu,
            mousemove: handleMapMouseMove,
            mouseup: handleMapMouseUp,
            mousedown: handleMapMouseDown
        });

        // Mark that we've set up handlers for this mode
        handlersSetupRef.current = currentMode;

        // Run simple logic that doesn't depend on layers
        if (currentMode === 'EDIT') {
            console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Entering EDIT mode - resetting state');
            isFirstClickRef.current = true;
            tempPointsRef.current = [];

            // Initialize temporary sources
            initializeTemporarySources(map);
            map.getCanvas().style.cursor = 'crosshair';
        } else {
            console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Exiting EDIT mode - cleaning up');
            // Clean up temporary sources
            cleanupTemporarySources(map);
            map.getCanvas().style.cursor = '';
            
            // Reset local refs when exiting EDIT mode (like backup)
            if (currentMode === 'EDIT') {
                snap1.current = null;
                snap2.current = null;
                snapCrossRef.current = null;
                console.log('🎯 EDIT MODE MANAGER: Local refs reset on exit');
            }
        }
    }, [currentMode, getMap, setupEventHandlers, handleMapClick, handleContextMenu, handleMapMouseMove, handleMapMouseUp, handleMapMouseDown]);

    const initializeTemporarySources = (map) => {
        // Create temporary sources and layers if they don't exist
        if (!map.getSource('tempLineSource')) {
            map.addSource('tempLineSource', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
        }

        if (!map.getSource('tempPointSource')) {
            map.addSource('tempPointSource', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
        }

        if (!map.getLayer('tempLineLayer')) {
            map.addLayer({
                id: 'tempLineLayer',
                type: 'line',
                source: 'tempLineSource',
                paint: { 'line-color': 'red', 'line-width': 2 },
            });
        }

        if (!map.getLayer('tempPointLayer')) {
            map.addLayer({
                id: 'tempPointLayer',
                type: 'circle',
                source: 'tempPointSource',
                paint: { 'circle-radius': 4, 'circle-color': 'blue' },
            });
        }
    };

    const cleanupTemporarySources = (map) => {
        // Clean up temporary sources and layers
        if (map.getLayer('tempLineLayer')) {
            map.removeLayer('tempLineLayer');
        }

        if (map.getLayer('tempPointLayer')) {
            map.removeLayer('tempPointLayer');
        }

        if (map.getSource('tempLineSource')) {
            map.removeSource('tempLineSource');
        }

        if (map.getSource('tempPointSource')) {
            map.removeSource('tempPointSource');
        }
    };

    // Setup handler functions defined before setupEventHandlers to fix hoisting
    // Normal mode handlers - father state manages ALL events
    const setupNormalModeHandlers = useCallback((map, handlers) => {
        console.log('🎯 EDIT MODE MANAGER: Setting up NORMAL mode handlers');

        try {
            // Context menu
            if (handlers.contextmenu) {
                map.on('contextmenu', handlers.contextmenu);
                eventHandlersRef.current.contextmenu = handlers.contextmenu;
            }

            // Basic mouse handlers
            if (handlers.mousemove) {
                map.on('mousemove', handlers.mousemove);
                eventHandlersRef.current.mousemove = handlers.mousemove;
            }

            if (handlers.mouseup) {
                map.on('mouseup', handlers.mouseup);
                eventHandlersRef.current.mouseup = handlers.mouseup;
            }

            // Layer-specific handlers only if layers exist
            if (map.getSource('sentieri')) {
                console.log('🎯 EDIT MODE MANAGER: Setting mouse event for sentieri');

                // Always remove existing click handler first to prevent duplication
                if (eventHandlersRef.current.sentieriClickHandler) {
                    map.off('click', 'sentieri', eventHandlersRef.current.sentieriClickHandler);
                    console.log('🎯 EDIT MODE MANAGER: Removed existing segment click handler');
                }

                // Segment click handler - store it in ref to prevent duplication
                const sentieriClickHandler = (e) => {
                    console.log('🎯 EDIT MODE MANAGER: click on sentieri');
                    const feature = e.features?.[0];
                    if (feature) {
                        console.log('🎯 EDIT MODE MANAGER: Segment clicked:', feature.properties);
                        const description = feature.properties?.Nome || 'Unnamed segment';
                        alert(`Segment: ${description}\nID: ${feature.properties?.id}`);
                    }
                };

                map.on('click', 'sentieri', sentieriClickHandler);
                eventHandlersRef.current.sentieriClickHandler = sentieriClickHandler;
                console.log('🎯 EDIT MODE MANAGER: Segment click handler added');

                // Destination click handler - show CrossRoadForm for editing
                const destinazioniClickHandler = (e) => {
                    console.log('🎯 EDIT MODE MANAGER: click on destinazioni');
                    const feature = e.features?.[0];
                    if (feature) {
                        console.log('🎯 EDIT MODE MANAGER: Destination clicked:', feature.properties);
                        dispatch({
                            type: 'SHOW_CROSSROAD_FORM',
                            payload: {
                                feature: { current: feature }, // Wrap in ref-like structure
                                coordinates: e.lngLat,
                                featureType: 'destinazione'
                            }
                        });
                    }
                };

                // Crossroad click handler - show CrossRoadForm for editing
                const incrociClickHandler = (e) => {
                    console.log('🎯 EDIT MODE MANAGER: click on incroci');
                    const feature = e.features?.[0];
                    if (feature) {
                        console.log('🎯 EDIT MODE MANAGER: Crossroad clicked:', feature.properties);
                        dispatch({
                            type: 'SHOW_CROSSROAD_FORM',
                            payload: {
                                feature: { current: feature }, // Wrap in ref-like structure
                                coordinates: e.lngLat,
                                featureType: 'incrocio'
                            }
                        });
                    }
                };

                // Set up destination and crossroad click handlers
                map.on('click', 'destinazioni', destinazioniClickHandler);
                map.on('click', 'incroci', incrociClickHandler);
                eventHandlersRef.current.destinazioniClickHandler = destinazioniClickHandler;
                eventHandlersRef.current.incrociClickHandler = incrociClickHandler;
                console.log('🎯 EDIT MODE MANAGER: Destination and crossroad click handlers added');

                // Hover behavior for sentieri (segments)
                // Always remove existing hover handlers first to prevent duplication
                if (eventHandlersRef.current.mouseenter.sentieri) {
                    map.off('mouseenter', 'sentieri', eventHandlersRef.current.mouseenter.sentieri);
                }
                if (eventHandlersRef.current.mouseleave.sentieri) {
                    map.off('mouseleave', 'sentieri', eventHandlersRef.current.mouseleave.sentieri);
                }

                map.on('mouseenter', 'sentieri', mouseEnterSentieri);
                eventHandlersRef.current.mouseenter.sentieri = mouseEnterSentieri;
                console.log('🎯 EDIT MODE MANAGER: Sentieri mouseenter handler added');

                map.on('mouseleave', 'sentieri', mouseLeaveSentieri);
                eventHandlersRef.current.mouseleave.sentieri = mouseLeaveSentieri;
                console.log('🎯 EDIT MODE MANAGER: Sentieri mouseleave handler added');

                // CRITICAL: Ensure segment paint properties are set to dynamic expressions for hover
                // Use the same approach as the hover handlers for consistency
                map.setPaintProperty('sentieri', 'line-color', ENV.PATH);
                console.log('🎯 EDIT MODE MANAGER: Segment paint properties restored for hover effects');
            }

            // Destinazioni handlers
            if (map.getLayer('destinazioni')) {
                console.log('🎯 EDIT MODE MANAGER: Setting mouse event for destinazioni');

                if (handlers.mousedown) {
                    // Create a wrapper that checks for EDIT mode like backup
                    const mousedownWrapper = (e) => {
                        // Check if we're in EDIT mode (like backup)
                        if (publicCurrentMode === 'EDIT') return;
                        handlers.mousedown(e);
                    };
                    map.on('mousedown', 'destinazioni', mousedownWrapper);
                    eventHandlersRef.current.mousedown = mousedownWrapper;
                }

                // Hover behavior for destinazioni (destinations) - EXACTLY like backup
                map.on('mouseenter', 'destinazioni', (e) => {
                    const featureId = e.features[0].properties.id;
                    
                    // ALWAYS set visual hover effects (like backup)
                    map.setPaintProperty('destinazioni', 'circle-color', [
                        'case',
                        ['==', ['get', 'id'], featureId],
                        ENV.DESTINATION_OVER, // Hover color
                        ENV.DESTINATION // Default color
                    ]);
                    
                    // Check if we're in EDIT mode for snapping (like backup)
                    if (publicCurrentMode === 'EDIT') {
                        const clickedCoordinates = e.features[0].geometry.coordinates;
                        snapCrossRef.current = { clickedCoordinates, featureId };
                    }
                    
                    map.getCanvas().style.cursor = 'pointer';
                });

                map.on('mouseleave', 'destinazioni', () => {
                    // Clear snap reference (like backup)
                    snapCrossRef.current = null;
                    
                    // ALWAYS reset visual effects (like backup)
                    map.setPaintProperty('destinazioni', 'circle-color', ENV.DESTINATION);
                    map.getCanvas().style.cursor = '';
                });

                // Ensure destination paint properties are set to static values (hover is handled by event handlers)
                map.setPaintProperty('destinazioni', 'circle-color', ENV.DESTINATION);
            }

            // Incroci handlers
            if (map.getLayer('incroci')) {
                console.log('🎯 EDIT MODE MANAGER: Setting mouse event for incroci');

                if (handlers.mousedown) {
                    // Create a wrapper that checks for EDIT mode like backup
                    const mousedownWrapper = (e) => {
                        // Check if we're in EDIT mode (like backup)
                        if (publicCurrentMode === 'EDIT') return;
                        handlers.mousedown(e);
                    };
                    map.on('mousedown', 'incroci', mousedownWrapper);
                    eventHandlersRef.current.mousedown = mousedownWrapper;
                    // ALWAYS set visual hover effects (like backup)
                    map.setPaintProperty('incroci', 'circle-color', [
                        'case',
                        ['==', ['get', 'id'], featureId],
                        ENV.CROSSROADS_OVER, // Hover color
                        ENV.CROSSROADS // Default color
                    ]);
                    
                    // Check if we're in EDIT mode for snapping (like backup)
                    if (publicCurrentMode === 'EDIT') {
                        const clickedCoordinates = e.features[0].geometry.coordinates;
                        snapCrossRef.current = { clickedCoordinates, featureId };
                    }
                    
                    map.getCanvas().style.cursor = 'pointer';
                });

                map.on('mouseleave', 'incroci', () => {
                    // Clear snap reference (like backup)
                    snapCrossRef.current = null;
                    
                    // ALWAYS reset visual effects (like backup)
                    map.setPaintProperty('incroci', 'circle-color', ENV.CROSSROADS);
                    map.getCanvas().style.cursor = '';
                });

                // Ensure crossroad paint properties are set to static values (hover is handled by event handlers)
                map.setPaintProperty('incroci', 'circle-color', ENV.CROSSROADS);
            }

            // Reset cursor to default for NORMAL mode
            map.getCanvas().style.cursor = '';
            console.log('🎯 EDIT MODE MANAGER: NORMAL mode handlers setup complete with hover restoration');

        } catch (error) {
            console.error('EDIT MODE MANAGER: Error setting up normal handlers:', error);
        }
    }, [mouseEnterSentieri, mouseLeaveSentieri]);

    // Edit mode handlers - father state manages ALL events
    const setupEditModeHandlers = useCallback((map, handlers) => {
        console.log('🎯 EDIT MODE MANAGER: Setting up EDIT mode handlers');

        try {
            map.getCanvas().style.cursor = 'crosshair';

            // COMPLETELY REMOVE ALL existing click handlers first
            if (map.getLayer('destinazioni')) {
                map.off('click', 'destinazioni');
                console.log('🎯 EDIT MODE MANAGER: Edit mode - removed existing destinazioni click handlers');
            }
            if (map.getLayer('incroci')) {
                map.off('click', 'incroci');
                console.log('🎯 EDIT MODE MANAGER: Edit mode - removed existing incroci click handlers');
            }

            // Use ONLY global click handler for edit mode (like backup implementation)
            // DO NOT add layer-specific click handlers for destinations/crossroads in edit mode
            if (handlers.click) {
                // Add global click for ALL clicks (features and empty map areas)
                // The handleEditModeClick function will handle feature detection internally
                map.on('click', handlers.click);
                console.log('🎯 EDIT MODE MANAGER: Edit mode - global click handler added (NO layer-specific handlers)');
            }

            // COMPLETELY DISABLE segment interactions in edit mode
            if (map.getLayer('sentieri')) {
                // Remove ALL segment event handlers including hover
                map.off('click', 'sentieri');
                map.off('mouseenter', 'sentieri');
                map.off('mouseleave', 'sentieri');
                
                // Also remove any existing hover handlers from the ref
                if (eventHandlersRef.current.mouseenter.sentieri) {
                    map.off('mouseenter', 'sentieri', eventHandlersRef.current.mouseenter.sentieri);
                }
                if (eventHandlersRef.current.mouseleave.sentieri) {
                    map.off('mouseleave', 'sentieri', eventHandlersRef.current.mouseleave.sentieri);
                }

                // Disable visual hover effects by setting paint properties to static values
                // This prevents any dynamic hover behavior
                map.setPaintProperty('sentieri', 'line-color', ENV.PATH || '#ff000080');
                console.log('🎯 EDIT MODE MANAGER: Edit mode - ALL segment interactions removed and visual effects disabled');
            }

            // ENABLE hover-based feature detection for destinations and crossroads in edit mode (like backup)
            // This is how the backup detects features for snapping
            if (map.getLayer('destinazioni')) {
                // Remove existing hover handlers first
                map.off('mouseenter', 'destinazioni');
                map.off('mouseleave', 'destinazioni');
                
                // Add hover handlers for feature detection (like backup)
                map.on('mouseenter', 'destinazioni', (e) => {
                    console.log('🎯 EDIT MODE MANAGER: Mouse enter destinazioni for snapping');
                    const featureId = e.features[0].properties.id;
                    const clickedCoordinates = e.features[0].geometry.coordinates;
                    snapCrossRef.current = { clickedCoordinates, featureId };
                    
                    // Visual feedback for snapping (like backup) - NO visual change in EDIT mode
                    // The backup doesn't change appearance in EDIT mode, only sets snapCrossRef
                    map.getCanvas().style.cursor = 'pointer';
                });

                map.on('mouseleave', 'destinazioni', () => {
                    console.log('🎯 EDIT MODE MANAGER: Mouse leave destinazioni - clearing snap');
                    snapCrossRef.current = null;
                    map.getCanvas().style.cursor = 'crosshair';
                });
                
                console.log('🎯 EDIT MODE MANAGER: Edit mode - destinazioni hover detection enabled (no visual change)');
            }

            if (map.getLayer('incroci')) {
                // Remove existing hover handlers first
                map.off('mouseenter', 'incroci');
                map.off('mouseleave', 'incroci');
                
                // Add hover handlers for feature detection (like backup)
                map.on('mouseenter', 'incroci', (e) => {
                    console.log('🎯 EDIT MODE MANAGER: Mouse enter incroci for snapping');
                    const featureId = e.features[0].properties.id;
                    const clickedCoordinates = e.features[0].geometry.coordinates;
                    snapCrossRef.current = { clickedCoordinates, featureId };
                    
                    // Visual feedback for snapping (like backup) - NO visual change in EDIT mode
                    // The backup doesn't change appearance in EDIT mode, only sets snapCrossRef
                    map.getCanvas().style.cursor = 'pointer';
                });

                map.on('mouseleave', 'incroci', () => {
                    console.log('🎯 EDIT MODE MANAGER: Mouse leave incroci - clearing snap');
                    snapCrossRef.current = null;
                    map.getCanvas().style.cursor = 'crosshair';
                });
                
                console.log('🎯 EDIT MODE MANAGER: Edit mode - incroci hover detection enabled (no visual change)');
            }
        } catch (error) {
            console.error('EDIT MODE MANAGER: Error setting up edit handlers:', error);
        }
    }, []);

    // Auto-segment handlers - father state manages ALL events
    const setupAutoSegmentHandlers = useCallback((map, handlers) => {
        console.log('🎯 EDIT MODE MANAGER: Setting up AUTO_SEGMENT mode handlers');

        try {
            map.getCanvas().style.cursor = 'crosshair';

            if (handlers.click) {
                if (map.getLayer('destinazioni')) {
                    map.on('click', 'destinazioni', handlers.click);
                }
                if (map.getLayer('incroci')) {
                    map.on('click', 'incroci', handlers.click);
                }
            }

            // COMPLETELY DISABLE segment interactions in auto-segment mode
            if (map.getLayer('sentieri')) {
                // Remove ALL segment event handlers
                map.off('click', 'sentieri');
                map.off('mouseenter', 'sentieri');
                map.off('mouseleave', 'sentieri');

                // Disable visual hover effects by setting paint properties to static values
                map.setPaintProperty('sentieri', 'line-color', ENV.PATH || '#ff000080');
                console.log('🎯 EDIT MODE MANAGER: Auto-segment mode - ALL segment interactions removed and visual effects disabled');
            }

            // Also disable destination and crossroad hover effects in auto-segment mode
            if (map.getLayer('destinazioni')) {
                map.setPaintProperty('destinazioni', 'circle-color', ENV.DESTINATION || '#0000ff');
            }

            if (map.getLayer('incroci')) {
                map.setPaintProperty('incroci', 'circle-color', ENV.CROSSROADS || '#ff0000');
            }
        } catch (error) {
            console.error('EDIT MODE MANAGER: Error setting up auto-segment handlers:', error);
        }
    }, []);


    const cancelEditing = useCallback(() => {
        console.log('🎯 EDIT MODE MANAGER: CANCEL EDITING FUNCTION CALLED!');
        console.log('🎯 EDIT MODE MANAGER: Current state before cancellation:', {
            currentMode,
            tempPointsCount: tempPointsRef.current.length,
            isFirstClick: isFirstClickRef.current,
            globalEditMode: state.editMode
        });

        const map = getMap();
        if (map) {
            console.log('🎯 EDIT MODE MANAGER: Cleaning up temporary features from map');

            // Clean up temporary sources and layers
            if (map.getLayer('tempLineLayer')) {
                console.log('🎯 EDIT MODE MANAGER: Removing tempLineLayer');
                map.removeLayer('tempLineLayer');
            } else {
                console.log('🎯 EDIT MODE MANAGER: tempLineLayer not found');
            }

            if (map.getLayer('tempPointLayer')) {
                console.log('🎯 EDIT MODE MANAGER: Removing tempPointLayer');
                map.removeLayer('tempPointLayer');
            } else {
                console.log('🎯 EDIT MODE MANAGER: tempPointLayer not found');
            }

            if (map.getSource('tempLineSource')) {
                console.log('🎯 EDIT MODE MANAGER: Removing tempLineSource');
                map.removeSource('tempLineSource');
            } else {
                console.log('🎯 EDIT MODE MANAGER: tempLineSource not found');
            }

            if (map.getSource('tempPointSource')) {
                console.log('🎯 EDIT MODE MANAGER: Removing tempPointSource');
                map.removeSource('tempPointSource');
            } else {
                console.log('🎯 EDIT MODE MANAGER: tempPointSource not found');
            }

            // Reset cursor
            map.getCanvas().style.cursor = '';
            console.log('🎯 EDIT MODE MANAGER: Cursor reset to default');
        } else {
            console.log('🎯 EDIT MODE MANAGER: Map not available for cleanup');
        }

        // Reset local state
        tempPointsRef.current = [];
        isFirstClickRef.current = true;
        console.log('🎯 EDIT MODE MANAGER: Local state reset - tempPoints:', tempPointsRef.current.length, 'isFirstClick:', isFirstClickRef.current);

        // Reset global edit mode state
        console.log('🎯 EDIT MODE MANAGER: Dispatching RESET_EDIT_MODE to clear global state');
        dispatch({ type: 'RESET_EDIT_MODE' });

        // Exit edit mode
        console.log('🎯 EDIT MODE MANAGER: Dispatching SET_MAP_MODE to NORMAL');
        dispatch({ type: 'SET_MAP_MODE', payload: 'NORMAL' });

        console.log('🎯 EDIT MODE MANAGER: Cancel editing completed successfully!');
    }, [getMap, dispatch, currentMode, state.editMode]);



    return {
        // Father state
        currentMode,
        publicCurrentMode,

        // Edit mode state
        isFirstClickRef,
        tempPointsRef,

        // Actions
        handleEditModeClick,
        cancelEditing,

        // Enhanced event handlers for MapContainer
        handleMapClick,
        handleContextMenu,
        handleMapMouseDown,
        handleMapMouseMove,
        handleMapMouseUp,

        // Event management - father state manages ALL events
        setupEventHandlers,
        clearAllEventHandlers,
        setupNormalModeHandlers,
        setupEditModeHandlers,
        setupAutoSegmentHandlers,
    };
};
