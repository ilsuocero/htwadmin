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
  const updateTemporarySources = useCallback((map, points) => {
    // Update temporary point source
    const tempPointSource = map.getSource('tempPointSource');
    if (tempPointSource) {
      const tempPointData = {
        type: 'FeatureCollection',
        features: points,
      };
      tempPointSource.setData(tempPointData);
    }
    
    // Update temporary line source
    const tempLineSource = map.getSource('tempLineSource');
    if (tempLineSource) {
      const lineStringFeature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: points.map(point => point.geometry.coordinates),
        },
        properties: {},
      };
      tempLineSource.setData(lineStringFeature);
    }
  }, []);

  const handleEditModeClick = useCallback((e) => {
    console.log('🎯 EDIT MODE MANAGER: Edit mode click at:', e.lngLat);
    console.log('🎯 EDIT MODE MANAGER: Click features:', e.features?.length || 0);
    
    const map = getMap();
    if (!map) return;
    
    const clickedFeatures = e.features || [];
    
    if (clickedFeatures.length > 0) {
      // We clicked on a feature (crossroad/destination)
      const feature = clickedFeatures[0];
      const layerId = feature.source;
      
      if (layerId === 'destinazioni' || layerId === 'incroci') {
        const featureId = feature.properties.id;
        const clickedCoordinates = feature.geometry.coordinates;
        console.log('🎯 EDIT MODE MANAGER: Clicking on feature:', featureId, clickedCoordinates);
        
        // Store the snap coordinates
        if (isFirstClickRef.current) {
          console.log('🎯 EDIT MODE MANAGER: First snap to feature');
          dispatch({ 
            type: 'SET_EDIT_MODE_SNAP1', 
            payload: { clickedCoords: clickedCoordinates, featureId, featureType: layerId } 
          });
          isFirstClickRef.current = false;
        } else {
          console.log('🎯 EDIT MODE MANAGER: Second snap to feature');
          dispatch({ 
            type: 'SET_EDIT_MODE_SNAP2', 
            payload: { clickedCoords: clickedCoordinates, featureId, featureType: layerId } 
          });
          
          // Show completion popup when both endpoints are snapped
          setTimeout(() => {
            const confirmed = window.confirm('Segment completed!\n\nClick "Save" to save the segment or "Continue" to keep editing.');
            if (confirmed) {
              // User clicked Save - show the PathForm
              dispatch({ 
                type: 'SHOW_PATH_FORM', 
                payload: { 
                  coordinates: tempPointsRef.current.map(point => point.geometry.coordinates),
                  snap1: state.editMode.snap1,
                  snap2: state.editMode.snap2
                }
              });
            } else {
              // User clicked Continue - stay in edit mode
              console.log('User chose to continue editing');
            }
          }, 100);
        }
        
        // Add the snapped point to our temporary points
        const clickedPoint = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: clickedCoordinates,
          },
          properties: {},
        };
        
        tempPointsRef.current.push(clickedPoint);
        
        // Update temporary sources
        updateTemporarySources(map, tempPointsRef.current);
        
        // Update global state with coordinates
        const coordinates = tempPointsRef.current.map(point => point.geometry.coordinates);
        dispatch({ type: 'SET_EDIT_MODE_COORDINATES', payload: coordinates });
        
        return; // Exit early since we handled a feature click
      }
    }
    
    // If we get here, we clicked on empty map (no features)
    if (isFirstClickRef.current) {
      // First click must be on a crossroad/destination
      alert('You must start from a destination or a crossroad. \nWarning: before creating the segment check if both \nendpoints ( )<-segment->( ) are in place.');
      return;
    }
    
    // Add intermediate point on empty map
    const clickedCoords = [e.lngLat.lng, e.lngLat.lat];
    const clickedPoint = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: clickedCoords,
      },
      properties: {},
    };
    
    tempPointsRef.current.push(clickedPoint);
    updateTemporarySources(map, tempPointsRef.current);
    
    // Update global state with coordinates
    const coordinates = tempPointsRef.current.map(point => point.geometry.coordinates);
    dispatch({ type: 'SET_EDIT_MODE_COORDINATES', payload: coordinates });
    
  }, [dispatch, state.editMode.snap1, state.editMode.snap2, updateTemporarySources]);

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
  const handleMapMouseDown = useCallback(() => {}, []);
  const handleMapMouseMove = useCallback(() => {}, []);
  const handleMapMouseUp = useCallback(() => {}, []);
  
  // All edit mode state management here
  const isFirstClickRef = useRef(true);
  const tempPointsRef = useRef([]);
  
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
  
  // Track layer availability - father state monitors ALL layers
  const [layersAvailable, setLayersAvailable] = useState({
    sentieri: false,
    destinazioni: false,
    incroci: false
  });
  
  // Track pending mode setup - when currentMode changes but layers aren't available yet
  const [pendingModeSetup, setPendingModeSetup] = useState(false);
  
  // Sync with global state
  useEffect(() => {
    console.log('🔍 EDIT MODE MANAGER: Global state mode changed to:', state.map.mode);
    setCurrentMode(state.map.mode);
  }, [state.map.mode]);
  
  // Monitor layer availability - father state knows when ALL layers are ready
  useEffect(() => {
    const map = getMap();
    console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Layer monitoring effect triggered', {
      hasMap: !!map
    });
    
    if (!map) {
      console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Map not available for layer monitoring, will retry in 500ms');
      
      // Retry after a delay if map isn't available yet
      const retryTimer = setTimeout(() => {
        console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Retrying layer monitoring...');
        // This effect will run again due to getMap dependency
      }, 500);
      
      return () => {
        clearTimeout(retryTimer);
      };
    }
    
    console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Starting layer availability monitoring');
    
    let checkCount = 0;
    const maxChecks = 20; // Stop checking after 10 seconds
    
    const checkLayers = () => {
      checkCount++;
      if (checkCount > maxChecks) {
        console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Max layer checks reached, stopping monitoring');
        clearInterval(interval);
        return;
      }
      
      const newLayersAvailable = {
        sentieri: !!map.getLayer('sentieri'),
        destinazioni: !!map.getLayer('destinazioni'),
        incroci: !!map.getLayer('incroci')
      };
      
      console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Layer availability check:', newLayersAvailable);
      
      // Check if all layers are now available
      const allLayersAvailable = newLayersAvailable.sentieri && newLayersAvailable.destinazioni && newLayersAvailable.incroci;
      
      // Always update state to ensure coordinated effect triggers
      // Use functional update to avoid stale closure issues
      setLayersAvailable(prevLayers => {
        if (JSON.stringify(newLayersAvailable) !== JSON.stringify(prevLayers)) {
          console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Layers changed, updating state');
          
          if (allLayersAvailable) {
            console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: ALL LAYERS ARE NOW AVAILABLE!');
            // Stop monitoring once all layers are available
            clearInterval(interval);
          }
          
          return newLayersAvailable;
        }
        return prevLayers;
      });
    };
    
    // Check layers periodically
    const interval = setInterval(checkLayers, 500);
    
    // Cleanup function
    return () => {
      console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Stopping layer availability monitoring');
      clearInterval(interval);
    };
  }, [getMap]); // Remove layersAvailable from dependencies to prevent infinite loop
  
  // When mode changes, update both states and track pending setup
  useEffect(() => {
    console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Mode changed -', currentMode);
    setPublicCurrentMode(currentMode);
    
    // Set pending mode setup BEFORE map check - this ensures we record the mode change
    // even if map isn't available yet
    console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Setting pending mode setup to TRUE for mode:', currentMode);
    setPendingModeSetup(true);
    
    const map = getMap();
    if (!map) return;
    
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
    }
  }, [currentMode, getMap]);
  
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
        
        // Only set up segment click handler if it doesn't exist yet
        if (!eventHandlersRef.current.sentieriClickHandler) {
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
        } else {
          console.log('🎯 EDIT MODE MANAGER: Segment click handler already exists, skipping');
        }
        
        // Hover behavior for sentieri (segments)
        if (!eventHandlersRef.current.mouseenter.sentieri) {
          map.on('mouseenter', 'sentieri', mouseEnterSentieri);
          eventHandlersRef.current.mouseenter.sentieri = mouseEnterSentieri;
          console.log('🎯 EDIT MODE MANAGER: Sentieri mouseenter handler added');
        }
        
        if (!eventHandlersRef.current.mouseleave.sentieri) {
          map.on('mouseleave', 'sentieri', mouseLeaveSentieri);
          eventHandlersRef.current.mouseleave.sentieri = mouseLeaveSentieri;
          console.log('🎯 EDIT MODE MANAGER: Sentieri mouseleave handler added');
        }
      }
      
      // Destinazioni handlers
      if (map.getLayer('destinazioni')) {
        console.log('🎯 EDIT MODE MANAGER: Setting mouse event for destinazioni');
        
        if (handlers.mousedown) {
          map.on('mousedown', 'destinazioni', handlers.mousedown);
          eventHandlersRef.current.mousedown = handlers.mousedown;
        }
        
        // Hover behavior for destinazioni (destinations)
        map.on('mouseenter', 'destinazioni', (e) => {
          const featureId = e.features[0].properties.id;
          map.setPaintProperty('destinazioni', 'circle-color', [
            'case',
            ['==', ['get', 'id'], featureId],
            ENV.DESTINATION_OVER, // Hover color
            ENV.DESTINATION // Default color
          ]);
          map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', 'destinazioni', () => {
          map.setPaintProperty('destinazioni', 'circle-color', ENV.DESTINATION);
          map.getCanvas().style.cursor = '';
        });
      }
      
      // Incroci handlers
      if (map.getLayer('incroci')) {
        console.log('🎯 EDIT MODE MANAGER: Setting mouse event for incroci');
        
        if (handlers.mousedown) {
          map.on('mousedown', 'incroci', handlers.mousedown);
          eventHandlersRef.current.mousedown = handlers.mousedown;
        }
        
        // Hover behavior for incroci (crossroads)
        map.on('mouseenter', 'incroci', (e) => {
          const featureId = e.features[0].properties.id;
          map.setPaintProperty('incroci', 'circle-color', [
            'case',
            ['==', ['get', 'id'], featureId],
            ENV.CROSSROADS_OVER, // Hover color
            ENV.CROSSROADS // Default color
          ]);
          map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', 'incroci', () => {
          map.setPaintProperty('incroci', 'circle-color', ENV.CROSSROADS);
          map.getCanvas().style.cursor = '';
        });
      }
      
    } catch (error) {
      console.error('EDIT MODE MANAGER: Error setting up normal handlers:', error);
    }
  }, [mouseEnterSentieri, mouseLeaveSentieri]);

  // Edit mode handlers - father state manages ALL events
  const setupEditModeHandlers = useCallback((map, handlers) => {
    console.log('🎯 EDIT MODE MANAGER: Setting up EDIT mode handlers');
    
    try {
      map.getCanvas().style.cursor = 'crosshair';
      
      // Use layer-specific click handlers ONLY for edit mode
      if (handlers.click) {
        // Add layer-specific handlers for crossroads/destinations
        if (map.getLayer('destinazioni')) {
          map.on('click', 'destinazioni', handlers.click);
          console.log('🎯 EDIT MODE MANAGER: Edit mode - destinazioni click handler added');
        }
        if (map.getLayer('incroci')) {
          map.on('click', 'incroci', handlers.click);
          console.log('🎯 EDIT MODE MANAGER: Edit mode - incroci click handler added');
        }
        // Add global click for intermediate points (empty map areas)
        map.on('click', handlers.click);
        console.log('🎯 EDIT MODE MANAGER: Edit mode - global click handler added');
      }
      
      // Remove segment interactions in edit mode
      if (map.getLayer('sentieri')) {
        // Remove segment click handlers
        map.off('click', 'sentieri');
        // Remove segment hover effects
        map.off('mouseenter', 'sentieri');
        map.off('mouseleave', 'sentieri');
        
        // Disable visual hover effects by setting paint properties to static values
        map.setPaintProperty('sentieri', 'line-color', '#ff000080');
        console.log('🎯 EDIT MODE MANAGER: Edit mode - segment interactions removed and visual effects disabled');
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
    } catch (error) {
      console.error('EDIT MODE MANAGER: Error setting up auto-segment handlers:', error);
    }
  }, []);

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
  }, [mapRef, clearAllEventHandlers, setupNormalModeHandlers, setupEditModeHandlers, setupAutoSegmentHandlers]);
  
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
  }, [mapRef, dispatch, currentMode, state.editMode]);
  
  // Coordinated effect - sets up event handlers when both conditions are met:
  // 1. We have a pending mode setup (currentMode changed)
  // 2. All layers are available
  useEffect(() => {
    console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Coordinated effect DEPENDENCIES CHANGED', {
      pendingModeSetup,
      layersAvailable,
      currentMode
    });
    
    const map = getMap();
    if (!map) {
      console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Coordinated effect - Map not available');
      return;
    }
    
    console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Coordinated effect triggered', {
      pendingModeSetup,
      layersAvailable,
      currentMode,
      hasMap: !!map
    });
    
    // Check if we have a pending mode setup AND all layers are available
    const allLayersAvailable = layersAvailable.sentieri && layersAvailable.destinazioni && layersAvailable.incroci;
    
    console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Coordinated effect - Conditions check', {
      pendingModeSetup,
      allLayersAvailable,
      layersAvailable,
      currentMode
    });
    
    if (pendingModeSetup && allLayersAvailable) {
      console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Coordinated setup - Mode:', currentMode, 'Layers available:', allLayersAvailable);
      console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Setting up event handlers for mode:', currentMode);
      
      // Set up event handlers for the current mode with all necessary handlers
      setupEventHandlers(currentMode, {
        click: handleMapClick,
        contextmenu: handleContextMenu,
        mousemove: handleMapMouseMove,
        mouseup: handleMapMouseUp,
        mousedown: handleMapMouseDown
      });
      
      // Clear the pending setup - we've handled it
      console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Clearing pending mode setup');
      setPendingModeSetup(false);
    } else if (pendingModeSetup && !allLayersAvailable) {
      console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Waiting for layers to become available for mode:', currentMode);
      console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Current layer availability:', layersAvailable);
      
      // Set up a retry timer to check again after a delay
      const retryTimer = setTimeout(() => {
        console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Retry check for layers - still pending mode:', currentMode);
        
        // Force a re-check by triggering the effect again
        // This will happen automatically due to the dependencies
      }, 500);
      
      // Clean up the retry timer
      return () => {
        clearTimeout(retryTimer);
      };
    } else {
      console.log('🎯🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Coordinated effect - No action needed', {
        pendingModeSetup,
        allLayersAvailable
      });
    }
  }, [mapRef, pendingModeSetup, layersAvailable, setupEventHandlers, currentMode, handleMapClick, handleContextMenu, handleMapMouseMove, handleMapMouseUp, handleMapMouseDown]);


  return {
    // Father state
    currentMode,
    publicCurrentMode,
    
    // Edit mode state
    isFirstClickRef,
    tempPointsRef,
    
    // Layer availability - father state knows when ALL layers are ready
    layersAvailable,
    
    // Actions
    handleEditModeClick,
    cancelEditing,
    updateTemporarySources,
    
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
