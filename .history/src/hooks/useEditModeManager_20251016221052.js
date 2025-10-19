import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';
import ENV from '../ENV';

export const useEditModeManager = () => {
  const { state, dispatch } = useAppState();
  
  // Father state - manages ALL edit mode state AND ALL event handlers
  const [currentMode, setCurrentMode] = useState('NORMAL');
  const [publicCurrentMode, setPublicCurrentMode] = useState('NORMAL');
  
  // All edit mode state management here
  const isFirstClickRef = useRef(true);
  const tempPointsRef = useRef([]);
  
  // Store the actual map instance - father state gets it from MapContainer
  const storedMapInstance = useRef(null);
  
  // Function to set the map instance from MapContainer
  const setMapInstance = useCallback((map) => {
    console.log('🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Map instance set!', !!map);
    storedMapInstance.current = map;
  }, []);
  
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
  
  // Sync with global state
  useEffect(() => {
    console.log('🔍 EDIT MODE MANAGER: Global state mode changed to:', state.map.mode);
    setCurrentMode(state.map.mode);
  }, [state.map.mode]);
  
  // Monitor layer availability - father state knows when ALL layers are ready
  useEffect(() => {
    const map = storedMapInstance.current;
    if (!map) return;
    
    const checkLayers = () => {
      const newLayersAvailable = {
        sentieri: !!map.getLayer('sentieri'),
        destinazioni: !!map.getLayer('destinazioni'),
        incroci: !!map.getLayer('incroci')
      };
      
      console.log('📊 EDIT MODE MANAGER: Layer availability check:', newLayersAvailable);
      
      // Only update if layers changed
      if (JSON.stringify(newLayersAvailable) !== JSON.stringify(layersAvailable)) {
        console.log('📊 EDIT MODE MANAGER: Layers changed, updating state');
        setLayersAvailable(newLayersAvailable);
      }
    };
    
    // Check layers periodically until all are available
    const interval = setInterval(checkLayers, 500);
    
    return () => clearInterval(interval);
  }, [layersAvailable]);
  
  // When mode changes, update both states
  useEffect(() => {
    console.log('🎯 EDIT MODE MANAGER: Mode changed -', currentMode);
    setPublicCurrentMode(currentMode);
    
    const map = storedMapInstance.current;
    if (!map) return;
    
    if (currentMode === 'EDIT') {
      console.log('🎯 EDIT MODE MANAGER: Entering EDIT mode - resetting state');
      isFirstClickRef.current = true;
      tempPointsRef.current = [];
      
      // Initialize temporary sources
      initializeTemporarySources(map);
      map.getCanvas().style.cursor = 'crosshair';
    } else {
      console.log('🎯 EDIT MODE MANAGER: Exiting EDIT mode - cleaning up');
      // Clean up temporary sources
      cleanupTemporarySources(map);
      map.getCanvas().style.cursor = '';
    }
  }, [currentMode]);
  
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

  // Father state manages ALL event handlers
  const clearAllEventHandlers = useCallback(() => {
    console.log('🚀 EDIT MODE MANAGER: Clearing ALL event handlers');
    const map = storedMapInstance.current;
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
        mouseleave: {}
      };
      console.log('🚀 EDIT MODE MANAGER: All event handlers cleared successfully');
    } catch (error) {
      console.warn('🛑 EDIT MODE MANAGER: Error clearing event handlers:', error);
    }
  }, []);

  // Setup event handlers based on mode - father state manages ALL events
  const setupEventHandlers = useCallback((mode, handlers = {}) => {
    console.log('🎯 EDIT MODE MANAGER: Setting up event handlers for mode:', mode);
    const map = storedMapInstance.current;
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
  }, [mapRef, clearAllEventHandlers]);

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
        
        // Segment click handler
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
        eventHandlersRef.current.click = sentieriClickHandler;
        
        // Hover behavior for sentieri (segments)
        map.on('mouseenter', 'sentieri', (e) => {
          const featureId = e.features[0].properties.id;
          map.setPaintProperty('sentieri', 'line-color', [
            'case',
            ['==', ['get', 'id'], featureId],
            ENV.PATH_OVER, // New color for the specific feature
            ENV.PATH, // Default color for other features
          ]);
          map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', 'sentieri', () => {
          map.setPaintProperty('sentieri', 'line-color', ENV.PATH);
          map.getCanvas().style.cursor = '';
        });
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
            '#00ff00', // Hover color
            '#0000ff' // Default color
          ]);
          map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', 'destinazioni', () => {
          map.setPaintProperty('destinazioni', 'circle-color', '#0000ff');
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
            '#ffff00', // Hover color
            '#ff0000' // Default color
          ]);
          map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', 'incroci', () => {
          map.setPaintProperty('incroci', 'circle-color', '#ff0000');
          map.getCanvas().style.cursor = '';
        });
      }
      
    } catch (error) {
      console.error('EDIT MODE MANAGER: Error setting up normal handlers:', error);
    }
  }, []);

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
  
  const handleEditModeClick = useCallback((e) => {
    console.log('🎯 EDIT MODE MANAGER: Edit mode click at:', e.lngLat);
    console.log('🎯 EDIT MODE MANAGER: Click features:', e.features?.length || 0);
    
    const map = mapRef.current?.getMap();
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
    
  }, [mapRef, dispatch, state.editMode.snap1, state.editMode.snap2, updateTemporarySources]);
  
  const cancelEditing = useCallback(() => {
    console.log('🎯 EDIT MODE MANAGER: CANCEL EDITING FUNCTION CALLED!');
    console.log('🎯 EDIT MODE MANAGER: Current state before cancellation:', {
      currentMode,
      tempPointsCount: tempPointsRef.current.length,
      isFirstClick: isFirstClickRef.current,
      globalEditMode: state.editMode
    });
    
    const map = mapRef.current?.getMap();
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
  
  // Function to check if all layers are available and re-trigger event setup if needed
  const checkAndSetupEventHandlers = useCallback((mode, handlers = {}) => {
    console.log('🎯🎯🎯🎯🎯 checkAndSetupEventHandlers🎯🎯🎯');
    const map = mapRef.current?.getMap();
    if (!map) {
      console.log('🎯 EDIT MODE MANAGER: Map not available for event setup');
      return;
    }
    
    // Check ACTUAL map layers directly (bypass delayed state update)
    const actualLayersAvailable = {
      sentieri: !!map.getLayer('sentieri'),
      destinazioni: !!map.getLayer('destinazioni'),
      incroci: !!map.getLayer('incroci')
    };
    
    console.log('🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Checking ACTUAL layer availability for event setup:', actualLayersAvailable);
    console.log('🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Internal state layer availability:', layersAvailable);
    
    // Check if all required layers are available
    const allLayersAvailable = actualLayersAvailable.sentieri && actualLayersAvailable.destinazioni && actualLayersAvailable.incroci;
    
    if (allLayersAvailable) {
      console.log('🎯🎯🎯🎯🎯 EDIT MODE MANAGER: All layers available, setting up event handlers for mode:', mode);
      setupEventHandlers(mode, handlers);
    } else {
      console.log('🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Waiting for layers to become available...', actualLayersAvailable);
      
      // If layers aren't available yet, set up a one-time check when they become available
      const checkLayersOnce = () => {
        const updatedLayersAvailable = {
          sentieri: !!map.getLayer('sentieri'),
          destinazioni: !!map.getLayer('destinazioni'),
          incroci: !!map.getLayer('incroci')
        };
        
        const allAvailableNow = updatedLayersAvailable.sentieri && updatedLayersAvailable.destinazioni && updatedLayersAvailable.incroci;
        
        if (allAvailableNow) {
          console.log('🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Layers now available, setting up event handlers for mode:', mode);
          setupEventHandlers(mode, handlers);
        } else {
          console.log('🎯🎯🎯🎯🎯 EDIT MODE MANAGER: Still waiting for layers...', updatedLayersAvailable);
          setTimeout(checkLayersOnce, 100);
        }
      };
      
      // Start checking for layer availability
      setTimeout(checkLayersOnce, 100);
    }
  }, [mapRef, layersAvailable, setupEventHandlers]);

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
    
    // Event management - father state manages ALL events
    setupEventHandlers,
    clearAllEventHandlers,
    setupNormalModeHandlers,
    setupEditModeHandlers,
    setupAutoSegmentHandlers,
    checkAndSetupEventHandlers,
  };
};
